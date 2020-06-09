import IBatchWriter from '@sidetree/common/src/interfaces/IBatchWriter';
import IOperationProcessor from '@sidetree/common/src/interfaces/IOperationProcessor';
// import IRequestHandler from '../../lib/core/interfaces/IRequestHandler';
// import ITransactionProcessor from '../../lib/core/interfaces/ITransactionProcessor';
import IVersionManager from '@sidetree/common/src/interfaces/IVersionManager';
// import ITransactionSelector from '../../lib/core/interfaces/ITransactionSelector';

/**
 * Mock version manager for testing.
 */
export default class MockVersionManager implements IVersionManager {
  // Hard-coded to support only SHA256.
  public allSupportedHashAlgorithms = [18];

  public getBatchWriter(blockchainTime: number): IBatchWriter {
    throw new Error(
      'Not implemented. Use spyOn to override the functionality. Input: ' +
        blockchainTime
    );
  }
  public getOperationProcessor(blockchainTime: number): IOperationProcessor {
    throw new Error(
      'Not implemented. Use spyOn to override the functionality. Input: ' +
        blockchainTime
    );
  }
  // public getRequestHandler(blockchainTime: number): IRequestHandler {
  //   throw new Error(
  //     'Not implemented. Use spyOn to override the functionality. Input: ' +
  //       blockchainTime
  //   );
  // }
  // public getTransactionProcessor(
  //   blockchainTime: number
  // ): ITransactionProcessor {
  //   throw new Error(
  //     'Not implemented. Use spyOn to override the functionality. Input: ' +
  //       blockchainTime
  //   );
  // }
  // public getTransactionSelector(blockchainTime: number): ITransactionSelector {
  //   throw new Error(
  //     'Not implemented. Use spyOn to override the functionality. Input: ' +
  //       blockchainTime
  //   );
  // }
}