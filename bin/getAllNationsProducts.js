#!/usr/bin/env node
// maybe lost some data if the two server have diferent time

'use strict';
// npm modules
// const path = require('path');
const fs = require('fs');
const request = require('request');
const mongo = require('mongodb').MongoClient;
const cheerio = require('cheerio');
const argv = require('yargs').argv;

// personal modules
const log = require('./log');
const timer = require('./timer');
const dbConfig = require('./dbConfig');

// Sensitive data.
const WS_USER = '0014770';
const WS_PASSWORD = '728626';
// Not so Sensitive.
const WS_USER_FAKE = '0000';
const WS_PASSWORD_FAKE = '0000';
// Interval(min) to run the script.
const INTERVAL_RUN_MIN = 1;
// Interval(min) between querys.
const INTERVAL_REQ_MIN = 4;
// Keep last query time into a file.
const LAST_REQ_TIME_FILE_NAME = '.last_req';
const LAST_REQ_TIME_FILE = __dirname + '/' + LAST_REQ_TIME_FILE_NAME;
// dir to save xml files
const XML_DIR = __dirname + '/xml/';
// First time request.
const LAST_REQ_TIME_INIT = '2015-01-01T00:00:00.000Z';

// Last query date to use into next query.
let lastQuery;
// Keep timer value.
let timerAux;

log.info('Init', {run_interval_min: INTERVAL_RUN_MIN, request_interval_min: INTERVAL_REQ_MIN, last_req_time_file: LAST_REQ_TIME_FILE, last_req_time_init: LAST_REQ_TIME_INIT});

// args h - number of hours before now
if(typeof argv.h === 'number') {
  lastQuery = new Date();
  lastQuery.setHours(lastQuery.getHours() - argv.h);
  log.info(`Using last request time from command line.`, {last_req_time: lastQuery.toISOString()});
  // Make the query.
  reqWS();
// Read last query time from file.
} else{
  getLastReqDate();
}

// Run script.
setInterval(()=>{
  log.info('Running script');
  // Request web service.
  reqWS(lastQuery);
}, INTERVAL_RUN_MIN * 60000);

// Read last request date from file.
function getLastReqDate() {
  log.info(`Reading last request time from file.`);
  // Read file with last request date.
  fs.readFile(LAST_REQ_TIME_FILE, 'utf8', (err, data)=>{
    if (err) {
      // No last query file to read.
      if(err.code == 'ENOENT'){
        lastQuery = new Date(LAST_REQ_TIME_INIT);
        log.warn(`No last request time file, using last request time init.`, {last_req_time_init: LAST_REQ_TIME_INIT});
        // Make the query.
        reqWS();
      }
      // No expected error.
      else {
        log.error('Error reading last request time from file', {err: err});
        process.nextTick(process.exit(1));
        // todo: entry test
      }
    }
    // Get last query.
    else {
      // Update last query file.
      lastQuery = new Date((data).trim());
      log.info(`Gotta last request time from file.`, {last_req_time: lastQuery.toISOString()});
      // Make the query.
      reqWS();
    }
  });
}

// Request web service.
function reqWS() {
  // Elapsed time.
  let now = new Date();
  let elapsedTimeMin = Math.ceil((now.getTime() - lastQuery.getTime()) / 60000);
  // No time to query.
  if (elapsedTimeMin < INTERVAL_REQ_MIN) {
    log.info('No elapsed time to make web service request', {last_req_time: lastQuery.toISOString(), now_time: now.toISOString(), elapsed_time_min: elapsedTimeMin});
    return;
  }
  // let url = 'http://wspub.allnations.com.br/wsIntEstoqueClientes/ServicoReservasPedidosExt.asmx/RetornarListaProdutos?CodigoCliente=0014770&Senha=728626&Data=2016-08-30T09:00:00-03:00';
  // let url = 'http://wspub.allnations.com.br/wsIntEstoqueClientes/ServicoReservasPedidosExt.asmx/RetornarListaProdutos?CodigoCliente=0014770&Senha=728626&Data=' + lastQuery.toISOString();
  // let url = `http://wspub.allnations.com.br/wsIntEstoqueClientes/ServicoReservasPedidosExt.asmx/RetornarListaProdutos?CodigoCliente=${WS_USER}&Senha=${WS_PASSWORD}&Data=${lastQuery.toISOString()}`;
  // let urlLog = `http://wspub.allnations.com.br/wsIntEstoqueClientes/ServicoReservasPedidosExt.asmx/RetornarListaProdutos?CodigoCliente=${WS_USER_FAKE}&Senha=${WS_PASSWORD_FAKE}&Data=${lastQuery.toISOString()}`;
  let url = `http://wspub.allnations.com.br/wsIntEstoqueClientesV2/ServicoReservasPedidosExt.asmx/RetornarListaProdutosEstoque?CodigoCliente=${WS_USER}&Senha=${WS_PASSWORD}&Data=${lastQuery.toISOString()}`;
  let urlLog = `http://wspub.allnations.com.br/wsIntEstoqueClientesV2/ServicoReservasPedidosExt.asmx/RetornarListaProdutosEstoque?CodigoCliente=${WS_USER_FAKE}&Senha=${WS_PASSWORD_FAKE}&Data=${lastQuery.toISOString()}`;

  // Make the query.
  log.info('Making web service request', {last_req_time: lastQuery.toISOString(), now_time: now.toISOString(), elapsed_time_min: elapsedTimeMin, url: urlLog});
  // Request to ws.
  timer.begin('reqTime');
  request.get(url, (err, res, body) => {
    if (err) {      log.error('Error making web service request', {err: err});
      return;
    }
    timerAux = timer.end('reqTime');
    log.info('Web service request received', {req_duration_ms: timerAux});
    // Insert to db.
    dbInsert(body);
    // Write xml result to file.
    let xmlFile = XML_DIR + lastQuery.toISOString() + '--' + now.toISOString() + '.xml';
    fs.writeFile(xmlFile, body, (err)=>{
      if (err)
        log.error('Error saving xml ws response to file.', {err: err, xml_file: xmlFile});
      else
        log.info('Xml ws reaponse saved to file.', {xml_file: xmlFile});
    // Write last query date to file.
    });
    fs.writeFile(LAST_REQ_TIME_FILE, now.toISOString(), (err)=>{
      if (err)
        log.error('Error saving last request time to file.', {last_req_time: now.toISOString(), last_req_time_file: LAST_REQ_TIME_FILE});
      else
        log.info('Last request time saved to file.', {last_req_time: now.toISOString(), last_req_time_file: LAST_REQ_TIME_FILE});
    });
    // Update last query.
    lastQuery = now;
  });
}

// Insert/update data to db.
function dbInsert(xmlData) {
  // Connect to mongo.
  mongo.connect(dbConfig.url, (err, db)=>{
    if(err){
      log.error('MongoDb connection error.', {err: err});
    }
    // Convert xml to json (cheerio).
    timer.begin('mongoDbBulk');
    let $ = cheerio.load(xmlData, {xmlMode: true});
    let bulk = db.collection(dbConfig.collAllNationProducts).initializeUnorderedBulkOp();
    log.info('Products received.', {products_count: $('Produtos').length});
    $('Produtos').each(function(i, el) {
      bulk
        .find({
          code: ($(el).find('CODIGO').text()).trim(),
          stockLocation: ($(el).find('ESTOQUE').text()).trim()})
        .upsert()
        .updateOne({
          $set: {
            // Data da última atualização do produto
            ts : new Date(($(el).find('TIMESTAMP').text()).trim()),
            // Departamento do produto.
            department: ($(el).find('DEPARTAMENTO').text()).trim(),
            // Categoria do produto.
            category: ($(el).find('CATEGORIA').text()).trim(),
            // Sub-categoria do produto.
            subCategory: ($(el).find('SUBCATEGORIA').text()).trim(),
            // Fabricante do produto.
            manufacturer: ($(el).find('FABRICANTE').text()).trim(),
            // Identificador do produto.
            code: ($(el).find('CODIGO').text()).trim(),
            // Descrição do produto.
            desc: ($(el).find('DESCRICAO').text()).trim(),
            // Descrição técnica do produto.
            tecDesc: ($(el).find('DESCRTEC').text()).trim(),
            // Código do fabricante - não usado.
            partNum: ($(el).find('PARTNUMBER').text()).trim(),
            // Código de barras.
            ean: ($(el).find('EAN').text()).trim(),
            // Garantia em meses.
            warranty: parseInt(($(el).find('GARANTIA').text()).trim()),
            // Peso (kg).
            weight: parseFloat(($(el).find('PESOKG').text()).trim()),
            // Preço praticado pela All Nations para revenda.
            price: parseFloat(($(el).find('PRECOREVENDA').text()).trim()),
            // Preço praticado pela All Nations para revenda sem ST.
            priceNoST: parseFloat(($(el).find('PRECOSEMST').text()).trim()),
            // Situação do produto.
            // 0-indisponível no momento, 1-disponível.
            available: parseInt(($(el).find('DISPONIVEL').text()).trim()),
            // Caminho para a imagem do produto no site da All Nations.
            urlImg: ($(el).find('URLFOTOPRODUTO').text()).trim(),
            // Estoque de origem do produto (RJ, SC e ES).
            stockLocation: ($(el).find('ESTOQUE').text()).trim(),
            // Código de classificação fiscal.
            ncm: ($(el).find('NCM').text()).trim(),
            // Largura em centímetros
            width: parseFloat(($(el).find('LARGURA').text()).trim()),
            // Altura em centímetros
            height: parseFloat(($(el).find('ALTURA').text()).trim()),
            // Profundidade em centímetros
            deep: parseFloat(($(el).find('PROFUNDIDADE').text()).trim()),
            // Produto ativo para venda.
            // 0-não ativo, 1-ativo.
            active: parseInt(($(el).find('ATIVO').text()).trim()),
            // Indica se incide ICMS ST sobre o produto.
            //  0-não incide ICMS ST, 1-Incide ICMS ST.
            taxReplace: parseInt(($(el).find('SUBSTTRIBUTARIA').text()).trim()),
            // Indica a origem do produto (nacional, importado, adquirido no mercado interno, entre outros).
            origin: ($(el).find('ORIGEMPRODUTO').text()).trim(),
            // Estoque disponível no momento da consulta (max = 100);
            stockQtd: parseFloat(($(el).find('ESTOQUEDISPONIVEL').text()).trim())
          }
        });
    });
    timerAux = timer.end('mongoDbBulk');
    log.info('MongoDb bulk created.', {spend_time_bulk: timerAux});
    timer.begin('dbInsert');
    bulk.execute((err, r)=>{
      if(err){
        log.error('Error inserting products on mongoDb', {err: err});
      }
      else{
        timerAux = timer.end('dbInsert');
        log.info('MongoDb insert.', {spend_time_mongodb_insert: timerAux});
        log.debug('MongoDb insert.', {mongodb_insert: r});
      }
      // Include fields commercialize and idStore.
      timer.begin('dbUpdate');
      db.collection(dbConfig.collAllNationProducts).updateMany(
        {commercialize: {$exists: false}},
        {$set: {commercialize: false, storeProductId: ''}})
        .then(r=>{
          timerAux = timer.end('dbUpdate');
          log.info('MongoDb update.', {spend_time_mongodb_update: timerAux});
          log.debug('MongoDb update.', {mongodb_update: r});
        })
        .catch(err=>{
          log.error('Error updating products.commercialize on mongoDb', {err: err});
        });
      db.close();
    });
  });
}
