import * as amqp from 'amqplib';
import {connect, createChannel, declareQueue} from './utils/rabbitMq/rabbitMQ.js';



let channel;
connect().then(async(connection) => {
    channel = await createChannel(connection);
  })
  .catch((error) => console.error('Error connecting to rabbitmq:', error));

async function processTask(task){
    console.log('processTask', task)
  };
  
async function pickupTasks(){
    try{
      console.log('start pickupTasks');
      if(!connection || !channel){
        console.log('No connection');
        return;
      }

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
      console.log('end pickupTasks');
      await channel.close();
      await connection.close();
    
    }catch(error){
      console.error('error while updating data', error);
    }
    
  };

setInterval(pickupTasks, parseInt(process.env.PUBLISH_MESSAGE_INTERVAL)); 