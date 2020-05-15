import Web3 from 'web3';

export const logger = { log: () => {} };

export const getWeb3 = () => {
  return new Web3('http://localhost:8545');
};

export const web3 = getWeb3();
