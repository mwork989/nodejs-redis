import express from 'express';
import redis from 'redis';
import axios from 'axios'
const app = express();
const port = 8088;

//Connecting redis
const client = redis.createClient({
    host: '127.0.0.1',
    port: 6379
})

// default set zero
client.set('aprvisit', 0);

// Default route
app.get('/',(req,res) => {
    client.get('aprvisit', (err,aprvisit )=> {
        res.send('Number of visit is'+aprvisit);
        client.set('aprvisit', parseInt(aprvisit)+1)
    }) 
})
app.get('/api/search', (req, res) => {
  
    const query = (req.query.query).trim();
   
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&section=0&page=${query}`;
  
    
    return client.get(`wikipedia:${query}`, (err, result) => {
    
      if (result) {
        const resultJSON = JSON.parse(result);
        return res.status(200).json(resultJSON);
      } else { 
        return axios.get(searchUrl)
          .then(response => {
            const responseJSON = response.data;
          
            client.setex(`wikipedia:${query}`, 3600, JSON.stringify({ source: 'Redis Cache', ...responseJSON, }));
            
            return res.status(200).json({ source: 'Wikipedia API', ...responseJSON, });
          })
          .catch(err => {
            return res.json(err);
          });
      }
    });
  });

app.listen(port,() => {
    console.log('app is running on port'+ port)
})