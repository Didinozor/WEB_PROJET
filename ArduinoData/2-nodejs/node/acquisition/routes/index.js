var express = require('express');
var router = express.Router();
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')

const port = "COM6"

const arduino = new SerialPort({
  path: port,
  baudRate: 9600
})

arduino.on('error', (err)=>{
  console.log(err);
})

const etat = {
  lastTimestamp: 0,
  lastAcquisition: NaN,
  idle: true,
  values: [0, 0, 0]
}

let currentSession = null

const parser = arduino.pipe(new ReadlineParser({ delimiter: '\r\n' }))

parser.on('data', (data)=>{

  etat.lastTimestamp = new Date()
  etat.lastAcquisition = String(data)
  console.log(etat.lastAcquisition);

  etat.lastAcquisition === 'PINK' ? etat.values[0]++ : etat.lastAcquisition === 'YELLOW' ? etat.values[1]++ : etat.lastAcquisition === 'OTHER' ?  etat.values[2]++ : null;

  if(etat.idle === false && currentSession){
    createMeasure();
  }
})

// Fonction pour creer une nouvelle mesure & container
async function createMeasure() {
  const currentContainer = await prisma.container.create({
    data: {
      ballColor: etat.lastAcquisition,
      ballNumber: etat.lastAcquisition === 'PINK' ? etat.values[0] : etat.lastAcquisition === 'YELLOW' ? etat.values[1] : etat.lastAcquisition === 'OTHER' ?  etat.values[2] : null,
      idSession: currentSession.id
    }
  });

  await prisma.measure.create({
    data: {
      time: etat.lastTimestamp,
      ballColor: etat.lastAcquisition,
      idSession: currentSession.id,
      idContainer: currentContainer.id
    }
  });
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {  });
});

router.get('/log', async (req, res, next)=> {
  const sessions = await prisma.session.findMany()
  res.render('historic', { sessions: sessions })
})

router.post('/api/getSessionValues', (req, res, next)=>{
  const idSession = Number(req.body.idSession)
  prisma.measure.findMany({
    where: {
      idSession: idSession
    }
  }).then(val=>{
    res.status(200).json(val)
  })

  prisma.container.findMany({
    where: {
      idSession: idSession
    }
  }).then(val=>{
    res.status(200).json(val)
  })
})


router.post('/api/start', (req, res, next)=>{
  if(etat.idle === true){
    etat.idle=false
    startLogging()
    res.status(200).send()
  } else {
    res.status(403).send()
  }
})

router.post('/api/stop', (req, res, next)=>{
  if(etat.idle === false){
    etat.idle=true
    stopLogging()
    res.status(200).send()
  } else {
    res.status(403).send()
  }
  
})

router.post('/api/state', (req, res, next)=>{
  res.status(200).json(etat)
})

/* Api pour send le reset à l'arduino SEULEMENT en idle */
router.post('/api/sendData', (req, res, next)=>{
  if(etat.idle === true){
    arduino.write("true\n");
    etat.values = [0, 0, 0]
    res.status(200).send()
  } else {
    res.status(403).send()
  }
})

async function startLogging(){
  // Creer une nouvelle session
  currentSession = await prisma.session.create({})
  console.log(currentSession);
}

function stopLogging(){
  // Arreter la session en cours
  prisma.session.update({
    where: {
      id: currentSession.id
    },
    data: {
      stop: new Date()
    }
  }).then((v)=> {
    currentSession = null
    console.log('Session '+ v.id + ' closed');
  })
}

module.exports = router;
