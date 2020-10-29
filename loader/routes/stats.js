const db = require('txstate-node-utils/lib/mysql')
const express = require('express')
var router = express.Router()

router.get('/wait$', async (req, res) => {
  const rows = await db.getall(`
    SELECT DATE_FORMAT(job_created, "%Y-%m-%dT%H:00:00Z") as hour,
    ROUND(AVG(TIMESTAMPDIFF(MINUTE, job_created, encoding_started))) as avg_wait
    FROM queue
    WHERE status IN ('success', 'working')
    AND job_created > NOW() - INTERVAL 1 MONTH
    GROUP BY hour
  `)

  const data = rows.map(row => ({
    hour: new Date(row.hour),
    avg_wait: row.avg_wait
  }))
  res.json(data)
})

router.get('/wait.html$', async (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Wait Time - Mediaflo Encoder</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@2.9.4/dist/Chart.min.js" integrity="sha256-t9UJPrESBeG2ojKTIcFLPGF7nHi2vEc7f5A2KpH/UBU=" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/luxon@1.25.0/build/global/luxon.min.js" integrity="sha256-OVk2fwTRcXYlVFxr/ECXsakqelJbOg5WCj1dXSIb+nU=" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-luxon@0.2.2/dist/chartjs-adapter-luxon.min.js" integrity="sha256-bgbnCTiuk9rPHmlLrX1soTSIxQJs26agg9kSWIhdcfc=" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@0.21.0/dist/axios.min.js" integrity="sha256-OPn1YfcEh9W2pwF1iSS+yDk099tYj+plSrCS6Esa9NA=" crossorigin="anonymous"></script>
  </head>
  <body>
    <canvas id="waittimechart" width="1000" height="400"></canvas>
    <script>
      function parseTime (time) {
        return luxon.DateTime.fromISO(time)
      }
      async function main () {
        const { data } = await axios.get('/api/stats/wait')
        var ctx = document.getElementById('waittimechart').getContext('2d');
        var chart = new Chart(ctx, {
          type: 'line',
          data: {
            datasets: [{
              label: 'Average Wait',
              data: data.map(r => ({ x: r.hour, y: r.avg_wait }))
            }
          ]
          },
          options: {
            scales: {
              xAxes: [{
                type: 'time',
                time: {
                  parser: parseTime,
                  tooltipFormat: 'ccc LLL d @ ha'
                }
              }]
            }
          }
        })
      }
      main()
    </script>
  </body>
  </html>
  `)
})

module.exports = router
