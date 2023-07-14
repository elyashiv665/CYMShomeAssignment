const  mongoose =  require('mongoose');
const {connect, createChannel, declareQueue} = require('./utils/rabbitMq/rabbitMQ.js');
const express = require('express');
const amqp = require('amqplib');

// Connect to MongoDB database
mongoose
  .connect('mongodb://mongo/domains')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));



const app = express();
const port = 3000;


async function rabbitInit(){
    const connection = await connect(amqp);
    const channel = await createChannel(connection);
    return {connection, channel};
}

const {connection, channel} = rabbitInit();

app.post('/message', async (req, res) => {
    if(!req.body?.message){
        console.error('No message specified');
        res.json({
            statusCode: 400,
            message: 'No message specified'
        })
    }
    try{
        const task = {
            data: {
              message: req.body.message
            }
        };
        await publishToQueue(channel, process.env.MESSAGES_QUEUE_NAME, task)
    }catch(err){
        console.log('error publish to queue')
    }
});

app.listen(port, async() => {
    try{
        if(!channel || !connection){
            console.log('no connection');
        }else{
            console.log(`Server is running on port ${port}`);
            const existMessagesQueue = await channel.assertQueue(process.env.MESSAGES_QUEUE_NAME)
            if(!existMessagesQueue){
                await declareQueue(channel, process.env.UPDATE_DATA_QUEUE_NAME);
            }
        }
    }catch(error){
        console.error(error);
        await channel.close();
        await connection.close();
    }
});

