import {
  Config,
  ResponseModel,
  ResponseStatus,
  ProtocolVersionModel,
} from '@sidetree/common';
import {
  BatchScheduler,
  DownloadManager,
  Observer,
  Resolver,
  ServiceInfo,
  VersionManager,
} from '@sidetree/core';
import { EthereumLedger } from '@sidetree/ledger';
import { IpfsCas as Cas } from '@sidetree/cas';
import {
  OperationStore as MongoDbOperationStore,
  MongoDbOperationQueue,
  MongoDbTransactionStore,
  MongoDbUnresolvableTransactionStore,
} from '@sidetree/db';

/**
 * The core class that is instantiated when running a Sidetree node.
 */
export default class Core {
  protected transactionStore: MongoDbTransactionStore;
  private unresolvableTransactionStore: MongoDbUnresolvableTransactionStore;
  protected operationStore: MongoDbOperationStore;
  private versionManager: VersionManager;
  private blockchain: EthereumLedger;
  private cas: Cas;
  private downloadManager: DownloadManager;
  private observer: Observer;
  private batchScheduler: BatchScheduler;
  private resolver: Resolver;
  private serviceInfo: ServiceInfo;

  /**
   * Core constructor.
   */
  public constructor(
    config: Config,
    protocolVersions: ProtocolVersionModel[],
    blockchain: EthereumLedger
  ) {
    // Component dependency construction & injection.
    this.versionManager = new VersionManager(config, protocolVersions); // `VersionManager` is first constructed component.
    this.operationStore = new MongoDbOperationStore(
      config.mongoDbConnectionString,
      config.databaseName
    );
    this.blockchain = blockchain;
    this.cas = new Cas(config.contentAddressableStoreServiceUri);
    this.downloadManager = new DownloadManager(
      config.maxConcurrentDownloads,
      this.cas
    );
    this.resolver = new Resolver(this.versionManager, this.operationStore);
    this.batchScheduler = new BatchScheduler(
      this.versionManager,
      this.blockchain,
      config.batchingIntervalInSeconds
    );
    this.transactionStore = new MongoDbTransactionStore(
      config.mongoDbConnectionString,
      config.databaseName
    );
    this.unresolvableTransactionStore = new MongoDbUnresolvableTransactionStore(
      config.mongoDbConnectionString,
      config.databaseName
    );
    this.observer = new Observer(
      this.versionManager,
      this.blockchain,
      config.maxConcurrentDownloads,
      this.operationStore,
      this.transactionStore,
      this.unresolvableTransactionStore,
      config.observingIntervalInSeconds
    );

    this.serviceInfo = new ServiceInfo('core');
  }

  /**
   * The initialization method that must be called before consumption of this core object.
   * The method starts the Observer and Batch Writer.
   */
  public async initialize() {
    await this.transactionStore.initialize();
    await this.unresolvableTransactionStore.initialize();
    await this.operationStore.initialize();
    await this.blockchain.initialize();
    await this.versionManager.initialize(
      this.blockchain,
      this.cas,
      this.downloadManager,
      this.operationStore,
      this.resolver,
      this.transactionStore
    ); // `VersionManager` is last initialized component.

    await this.observer.startPeriodicProcessing();

    this.batchScheduler.startPeriodicBatchWriting();
    this.blockchain.startPeriodicCachedBlockchainTimeRefresh();
    this.downloadManager.start();
  }

  public async triggerBatchWriting() {
    await this.batchScheduler.writeOperationBatch();
  }

  public async triggerProcessTransactions() {
    await this.observer.processTransactions();
  }

  public async close() {
    const currentTime = this.blockchain.approximateTime;
    const operationQueue = this.versionManager.getOperationQueue(
      currentTime.time
    );
    if (operationQueue) {
      await (operationQueue as MongoDbOperationQueue).close();
    }
    await this.transactionStore.close();
    await this.unresolvableTransactionStore.close();
    await this.operationStore.close();
    await this.observer.stopPeriodicProcessing();
    this.batchScheduler.stopPeriodicBatchWriting();
  }

  /**
   * Handles an operation request.
   */
  public async handleOperationRequest(request: Buffer): Promise<ResponseModel> {
    const currentTime = this.blockchain.approximateTime;
    const requestHandler = this.versionManager.getRequestHandler(
      currentTime.time
    );
    const response = requestHandler.handleOperationRequest(request);
    return response;
  }

  /**
   * Handles resolve operation.
   * @param didOrDidDocument Can either be:
   *   1. Fully qualified DID. e.g. 'did:sidetree:abc' or
   *   2. An encoded DID Document prefixed by the DID method name. e.g. 'did:sidetree:<encoded-DID-Document>'.
   */
  public async handleResolveRequest(
    didOrDidDocument: string
  ): Promise<ResponseModel> {
    const currentTime = this.blockchain.approximateTime;
    const requestHandler = this.versionManager.getRequestHandler(
      currentTime.time
    );
    const response = requestHandler.handleResolveRequest(didOrDidDocument);
    return response;
  }

  /**
   * Handles the get version request. It gets the versions from the dependent services
   * as well.
   */
  public async handleGetVersionRequest(): Promise<ResponseModel> {
    const responses = [
      this.serviceInfo.getServiceVersion(),
      await this.blockchain.getServiceVersion(),
      await this.cas.getServiceVersion(),
    ];

    return {
      status: ResponseStatus.Succeeded,
      body: JSON.stringify(responses),
    };
  }
}
