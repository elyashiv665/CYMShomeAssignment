import mongoose from 'mongoose';
import {connect, createChannel, declareQueue, publishToQueue} from './utils/rabbitMq/rabbitMQ.js';
import express from 'express';

// Connect to MongoDB database
mongoose
  .connect('mongodb://mongo/domains')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));
 
let channel,connection;
connect()
.then(async(_connection) => {createChannel(_connection)
    .then((_channel => { 
        channel = _channel;
        connection = _connection; }));
  })
  .catch((error) => console.error('Error connecting to rabbitmq:', error));

const app = express();
const port = 3000;

app.use(express.urlencoded());
app.use(express.json());  


app.post('/messages', async (req, res) => {
    const message = req.body?.message;
    if(!message){
        console.error('No message specified');
        res.json({
            statusCode: 400,
            message: 'No message specified'
        })
        return;
    }

    if(!channel){
        console.log('no connection');
        res.json({statusCode: 500, message: 'connection error'})
        return;
    }

    try{
        const existMessagesQueue = await channel.assertQueue(process.env.PUBLISH_MESSAGES_QUEUE_NAME)
        if(!existMessagesQueue){
            await declareQueue(channel, process.env.UPDATE_DATA_QUEUE_NAME);
        }
    }catch(error){
        console.error('Error creating queue');
        res.json({statusCode: 500, message: 'connection error'});
        return;
    }
    try{
        const task = {
            id: Date.now(),
            data: message
          };
        await publishToQueue(channel, process.env.PUBLISH_MESSAGES_QUEUE_NAME, JSON.stringify(task));

        res.json({statusCode: 201, message: `Successfully save message: ${message}`})
    }catch(err){
        console.log('error publish to queue', err);
        res.json({statusCode: 500, message: 'Internal server error'})
    }
});

app.listen(port, async(err) => {
    if (err) {
        console.log("Error in server setup")
        console.error(error);
        await channel.close();
        await connection.close();
    }
    console.log(`Server is running on port ${port}`);
});

