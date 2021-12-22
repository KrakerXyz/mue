
import { RouteOptions } from 'fastify';
import { Stream } from 'stream';

export const test: RouteOptions = {
   method: 'GET',
   url: '/api/test',
   handler: async (req, res) => {

      const timer = (time: number) => new Promise(resolve => setTimeout(resolve, time));

      async function* counter() {
         let counter = 0;
         while (true) {
            await timer(0);
            yield counter++;
         }
      }

      const iter = counter();

      res.raw.writeHead(200, { 'Content-Type': 'text/event-stream' });

      const buffer = new Stream.Readable({ highWaterMark: 100 });
      buffer._read = () => { /* */ };

      res.status(200).header('Content-Type', 'text/event-stream').send(buffer);

      for await (const item of iter) {
         console.log(`Writing counter ${item}`);
         buffer.push(`event: counter\ndata: ${item}\n\n`);
         console.log(`Sent counter ${item}`);
      }

   }
};