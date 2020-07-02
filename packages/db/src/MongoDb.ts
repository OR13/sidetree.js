import { MongoClient } from 'mongodb';

/**
 * MongoDB related operations.
 */
export default class MongoDb {
  /**
   * Test if a MongoDB service is running at the specified url.
   */
  public static async isServerAvailable(serverUrl: string): Promise<boolean> {
    try {
      const client = await MongoClient.connect(serverUrl);
      await client.close();
    } catch (error) {
      console.log('Mongoclient connect error: ' + error);
      return false;
    }
    return true;
  }

  public static async resetDatabase(
    serverUrl: string,
    databaseName: string
  ): Promise<boolean> {
    try {
      const client = await MongoClient.connect(serverUrl);
      const db = await client.db(databaseName);
      const res = await db.dropDatabase();
      return res;
    } catch (error) {
      console.log('Mongoclient connect error: ' + error);
      return false;
    }
  }
}