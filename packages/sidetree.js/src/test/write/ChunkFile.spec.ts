/* eslint-disable jest/expect-expect */
import * as crypto from 'crypto';
import ChunkFile from '../../write/ChunkFile';
import Encoder from '../../util/Encoder';
import ErrorCode from '@sidetree/common/src/errors/ErrorCode';
import JasmineSidetreeErrorValidator from '../JasmineSidetreeErrorValidator';
import Jwk from '../../util/Jwk';
import Compressor from '../../util/Compressor';
import OperationGenerator from '../generators/OperationGenerator';

describe('ChunkFile', () => {
  describe('parse()', () => {
    it('should throw exception if there is an unknown property.', async () => {
      const createOperationData = await OperationGenerator.generateCreateOperation();
      const createOperation = createOperationData.createOperation;

      const chunkFileModel = {
        deltas: [createOperation.encodedDelta],
        unexpectedProperty: 'any value',
      };

      const rawData = Buffer.from(JSON.stringify(chunkFileModel));
      const compressedRawData = await Compressor.compress(Buffer.from(rawData));

      await JasmineSidetreeErrorValidator.expectSidetreeErrorToBeThrownAsync(
        () => ChunkFile.parse(compressedRawData),
        ErrorCode.ChunkFileUnexpectedProperty
      );
    });
  });

  describe('createBuffer()', () => {
    it('should create the buffer correctly.', async () => {
      const createOperationData = await OperationGenerator.generateCreateOperation();
      const createOperation = createOperationData.createOperation;

      const [, recoveryPrivateKey] = await Jwk.generateEs256kKeyPair();
      const recoverOperationData = await OperationGenerator.generateRecoverOperation(
        {
          didUniqueSuffix: 'didOfRecovery',
          recoveryPrivateKey,
        }
      );
      const recoverOperation = recoverOperationData.recoverOperation;

      const chunkFileBuffer = await ChunkFile.createBuffer(
        [createOperation],
        [recoverOperation],
        []
      );

      const decompressedChunkFileModel = await ChunkFile.parse(chunkFileBuffer);

      expect(decompressedChunkFileModel.deltas.length).toEqual(2);
      expect(decompressedChunkFileModel.deltas[0]).toEqual(
        createOperation.encodedDelta!
      );
      expect(decompressedChunkFileModel.deltas[1]).toEqual(
        recoverOperation.encodedDelta!
      );
    });
  });

  describe('validateDeltasProperty()', () => {
    it('should throw is `delta` property is not an array.', async () => {
      const deltas = 'Incorrect type.';

      JasmineSidetreeErrorValidator.expectSidetreeErrorToBeThrown(
        () => (ChunkFile as any).validateDeltasProperty(deltas),
        ErrorCode.ChunkFileDeltasPropertyNotArray
      );
    });

    it('should throw if any `delta` element is not a string.', async () => {
      const deltas = [
        1,
        2,
        3, // Intentionally incorrect type.
      ];

      JasmineSidetreeErrorValidator.expectSidetreeErrorToBeThrown(
        () => (ChunkFile as any).validateDeltasProperty(deltas),
        ErrorCode.ChunkFileDeltasNotArrayOfStrings
      );
    });

    it('should throw with random `delta` elements.', async () => {
      const randomBytes = crypto.randomBytes(2000); // Intentionally larger than maximum.
      const deltas = [Encoder.encode(randomBytes)];

      JasmineSidetreeErrorValidator.expectSidetreeErrorToBeThrown(
        () => (ChunkFile as any).validateDeltasProperty(deltas),
        ErrorCode.ChunkFileDeltaSizeExceedsLimit
      );
    });
  });
});