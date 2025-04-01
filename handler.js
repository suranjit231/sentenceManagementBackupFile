// ============ lambda function for filling master database collection ======================//

// Lambda function to fill master database collection
export const fillMasterDatabaseCollection = async (event) => {
  try {

    connectMongodb();
    for (const record of event.Records) {

      console.log("record.body in line 68 for filling masterCollection in handler.js file: ", record.body)
      const { keywordId } = JSON.parse(record.body);
      
      const result = await sentenceRepository.fillMasterSentenceCollection(keywordId);
      
      if (!result.success) {
        console.error(`Failed to fill master collection for keyword ${keywordId}: ${result.message}`);
        continue;
      }

      console.log(`Successfully filled master collection for keyword ${keywordId}`);

       // Trigger fillParentsDatabaseCollection via SQS
       await sqsClient.send(new SendMessageCommand({
        MessageBody: JSON.stringify({ keywordId }),
        QueueUrl: process.env.FILL_PARENTS_QUEUE_URL
      }));
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Master database collection processed successfully' }) 
    };
  } catch (error) {
    console.error('Error in fillMasterDatabaseCollection:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process master collection',
        details: error.message 
      })
    };
  }
};


// ================ lambda function for filling parents collection ===============================//

// Lambda function to fill parents database collection
export const fillParentsDatabaseCollection = async (event) => {
  try {

    connectMongodb();
    for (const record of event.Records) {

      console.log("filling parentCollection start in line 110 in handler.js file: ", record.body)
      const { keywordId } = JSON.parse(record.body);
      
      const result = await sentenceRepository.fillParentsSentenceDatabaseCollection(keywordId);
      
      if (!result.success) {
        console.error(`Failed to fill parents collection for keyword ${keywordId}: ${result.message}`);
        continue;
      }

      console.log(`Successfully filled parents collection for keyword ${keywordId}`);
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Parents database collection processed successfully' }) 
    };
  } catch (error) {
    console.error('Error in fillParentsDatabaseCollection:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process parents collection',
        details: error.message 
      })
    };
  }
};










