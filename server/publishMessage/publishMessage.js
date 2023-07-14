const {connect, createChannel, consumeFromQueue} = require('./utils.utils.js');

async function processTask(task){
    console.log('processTask', task)
  };
  
async function pickupTask(){
    try{
      const connection = await connect();
      const channel = await createChannel(connection);
      let isQueueEmpty = false;
      while (!isQueueEmpty) {
        await consumeFromQueue(channel, process.env.MESSAGES_QUEUE_NAME, async (message) => {
          if (message !== null) {
            const task = JSON.parse(message.content.toString());
            await processTask(task);
            console.log(`Consumer started for ${process.env.MESSAGES_QUEUE_NAME}`);
          } else {
            isQueueEmpty = true;
            console.log("No tasks remaining. Queue is empty.");
          }
        });
      }
      await channel.close();
      await connection.close();
    
    }catch(error){
      console.error('error while updating data', error);
    }
    
  };

pickupTask();