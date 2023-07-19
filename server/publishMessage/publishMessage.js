import {connect, createChannel, consumeFromQueue, publishToQueue} from './utils/rabbitMq/rabbitMQ.js';
import Message from './utils/mongo/models.js';
import mongoose from 'mongoose';

let channel,connection;

// Connect to MongoDB database
mongoose
  .connect('mongodb://mongo/domains')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

// Connect to rabbitmq
connect()
.then(async(_connection) => {createChannel(_connection)
    .then((_channel => { 
        channel = _channel;
        connection = _connection; }));
  })
  .catch((error) => console.error('Error connecting to rabbitmq:', error));

async function createInDB(message) {
    const newMessage = new Message({
      data: message
    });
    await newMessage.save();
}



async function processTask(incomeTask){
      const outcomeTask = {
        clientId: incomeTask.clientId,
        data: incomeTask.data,
        messageId: incomeTask.messageId,
        count: incomeTask.count
      };    
      console.log('outcomeTask', outcomeTask)
      await createInDB(incomeTask.data).then(async() =>{
        outcomeTask.status = 'success';
      }) .catch((error) => {
        console.error('Error create message in DB:', error);
        outcomeTask.status = 'error';
        
      });
      try{
        const existQueue = await channel.assertQueue(process.env.SAVED_MESSAGES_QUEUE_NAME)
        if(!existQueue){
            await declareQueue(channel, process.env.SAVED_MESSAGES_QUEUE_NAME);
        }
        await publishToQueue(channel, process.env.SAVED_MESSAGES_QUEUE_NAME, JSON.stringify(outcomeTask));
        console.log('successfully publish to queue:', JSON.stringify(outcomeTask));
      }catch(err){
        console.error(`Error publish task: ${outcomeTask} to queue:`, err);

      }

  };
  
async function pickupTasks(){
    try{
      if(!channel){
        console.log('No connection');
        return;
      }

      let isQueueEmpty = false;
      while (!isQueueEmpty) {
        await consumeFromQueue(channel, process.env.PUBLISH_MESSAGES_QUEUE_NAME, async (message) => {
          if (message !== null) {
            console.log('message consumed from queue');
            const task = JSON.parse(message.content.toString());
            await processTask(task);
          } else {
            isQueueEmpty = true;
            console.log("No tasks remaining. Queue is empty.");
          }
        });
      }
    }catch(error){
      console.error('error while updating data', error);
    }
    
  };

try{
// setInterval(pickupTasks, parseInt(process.env.PUBLISH_MESSAGE_INTERVAL)); 
  setInterval(pickupTasks, 5000); 
}catch(err){
  console.log('error publish messages', err);
  await channel.close();
  await connection.close();
}