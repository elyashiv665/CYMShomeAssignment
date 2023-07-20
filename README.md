    Run:
        client: cd src/client && npm install && npm start
        server: cd src/server && docker-compose build && docker-compose up
    
    Architecture:
            
        I implemented those 2 scripts that I want to run as microservices:
            -server: does what microservice A has to do;
            -publishMessage: lookup for messages that currently needs to push to DB and update the server;
            
        Additionally I have also specified a mongo docker and rabbitmq docker in the docker-compose.
        I save the message as a json in the DB with additional information such as clientId, count.
         
        Scheduling: I used js interval, other approaches would be to use cron
                    or lambda if in a cloud environment.
    
    
    Scale-up
    
            Since I work in localhost environment I didn't implement load balancer.In the cloud I would
            use API gateway.
            Also I can scale the update data docker containers according the queue state
            and I can scale the server according to load.
    



