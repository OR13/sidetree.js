import { getWeb3, logger } from '../__fixtures__';
import { LedgerEthereum } from '..';

const w31 = getWeb3();
const w32 = getWeb3();

describe('Concurrency', () => {
  let anchorContractAddress: any;

  beforeAll(async () => {
    const ledger0 = new LedgerEthereum(
      w31,
      '0xeaf43D28235275afDB504aBF49863e778a4Cfea0',
      logger
    );
    await ledger0._createNewContract();
    anchorContractAddress = ledger0.anchorContractAddress;
  });

  it('should be possible to write concurrently', async () => {
    const ledger1 = new LedgerEthereum(w31, anchorContractAddress, logger);
    const ledger2 = new LedgerEthereum(w32, anchorContractAddress, logger);
    expect(ledger1).toBeDefined();
    expect(ledger2).toBeDefined();

    try {
      await ledger1.write('Qmc9Asse4CvAuQJ77vMARRqLYTrL4ZzWK8BKb2FHRAYcuD');
      await ledger1.write('Qmc9Asse4CvAuQJ77vMARRqLYTrL4ZzWK8BKb2FHRAYcuD');
      await ledger2.write('Qmc9Asse4CvAuQJ77vMARRqLYTrL4ZzWK8BKb2FHRAYcuD');
      await ledger2.write('Qmc9Asse4CvAuQJ77vMARRqLYTrL4ZzWK8BKb2FHRAYcuD');
      await ledger1.write('Qmc9Asse4CvAuQJ77vMARRqLYTrL4ZzWK8BKb2FHRAYcuD');
      await ledger1.write('Qmc9Asse4CvAuQJ77vMARRqLYTrL4ZzWK8BKb2FHRAYcuD');
      await ledger2.write('Qmc9Asse4CvAuQJ77vMARRqLYTrL4ZzWK8BKb2FHRAYcuD');
      await ledger2.write('Qmc9Asse4CvAuQJ77vMARRqLYTrL4ZzWK8BKb2FHRAYcuD');
      await ledger1.write('Qmc9Asse4CvAuQJ77vMARRqLYTrL4ZzWK8BKb2FHRAYcuD');
      await ledger1.write('Qmc9Asse4CvAuQJ77vMARRqLYTrL4ZzWK8BKb2FHRAYcuD');
      await ledger2.write('Qmc9Asse4CvAuQJ77vMARRqLYTrL4ZzWK8BKb2FHRAYcuD');
      await ledger2.write('Qmc9Asse4CvAuQJ77vMARRqLYTrL4ZzWK8BKb2FHRAYcuD');
    } catch (e) {
      console.error(e);
    }
  });
});
