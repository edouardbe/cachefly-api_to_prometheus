'use strict';

const express = require('express');
const argumentParser = require('@edouardbe/command-line-arguments-configuration-file-environment-variables-parser');
const spawn = require('child_process').spawn;
const os = require('os');
const fs = require('fs');
var util = require('util');
var axios = require('axios');

const definitions = [
    { name: 'verbose', alias: 'v', type: Boolean, defaultIfMissing: false, defaultIfPresent: true, desc: "activate the verbose mode" },
    { name: 'bypass-initial-test', type: Boolean, defaultIfMissing: false, defaultIfPresent: true, desc: "used to bypass the initial test" },
    { name: 'configuration-file', type: String, desc: "location of the configuration file to read more variables" },
    { name: 'output-dir', type: String, defaultIfMissing: os.tmpdir(), desc: "the output directory where temporary data will be stored"  },
    { name: 'output-file', type: String, defaultIfMissing: "cachefly-api-to-prometheus.data" , desc: "the output file where temporary data will be stored"  },
    { name: 'logs-dir', type: String, defaultIfMissing: "/var/log", dirCreateIfMissing: true, desc:"the directory to write the logs"},
    { name: 'logs-file', type: String, defaultIfMissing: "cachefly-api-to-prometheus.log" , desc:"the file to write the logs" },
    { name: 'nodejs-port', type: 'integer', defaultIfMissing: 9145, required: true, desc:"the port to listen to" },
    { name: 'nodejs-path', type: String, defaultIfMissing: "/metrics", required: true,desc:"the path to listen to"},
    { name: 'cachefly-token', type: String, obfuscate: true, required: true, desc:"the Cachefly bearer token to authenticate to Cachefly"},
    { name: 'ignore-metrics', type: String, desc:"semi-column separated values of metrics to ignore"},
    { name: 'endpoint-chr', type: String, defaultIfMissing: "https://api.cachefly.com/api/2.5/reports/chr", desc: "the API endpoint to call for Cache Hit Ratio"},
    { name: 'metrics-prepend', type: String, defaultIfMissing: "cachefly_", desc: "add a header to the metric names for prometheus"}
  ]

const options = {
    envVarPrefix: "CATP_",
    cfgFileArg: 'configuration-file'
}

const parsedArguments = argumentParser(definitions, options);
            

const log_file = fs.createWriteStream(`${parsedArguments.get("logs-dir")}/${parsedArguments.get("logs-file")}`, {flags : 'a'});
const log_stdout = process.stdout;

function verbose(in_message) {
    if ( parsedArguments.get("verbose") != null && parsedArguments.get("verbose") != false) {
        log(in_message);
    }
}
function log(in_message) {
    if (log_file != null) {
        log_file.write(util.format(in_message) + '\n');
    }
    log_stdout.write(util.format(in_message) + '\n');
}

log(`Start at ${new Date()}` )

// verbose options
parsedArguments.getValuesAndSource().forEach(o => {
    verbose(`option ${o.name} is ${o.value} from ${o.from}`)
});


// FROM https://portal2.cachefly.com/static/js/main.dead67e9.chunk.js
const POPS = {
    'ams1' : { city:'Amsterdam', country : 'Netherlands', continent : 'Europe' } , 
    'ams2' : { city:'Amsterdam', country : 'Netherlands', continent : 'Europe' } , 
    'arn1' : { city:'Stockholm', country : 'Sweden', continent : 'Europe' } , 
    'atl1' : { city:'Atlanta', country : 'United States', continent : 'N. America' } , 
    'bog1' : { city:'Bogota', country : 'Colombia', continent : 'S. America' } , 
    'bom1':  { city: "Mumbai", country: "India", continent: "Asia" },
    'bom3' : { city:'Mumbai', country : 'India', continent : 'Asia' } ,
    'bos1' : { city:'Boston', country : 'United States', continent : 'N. America'  } , 
    'bsb1' : { city:'Brasilia', country : 'Brazil', continent : 'S. America'  } , 
    'cai1' : { city:'Singapore', country : 'Singapore', continent : 'Asia' } , 
    'cdg1' : { city:'Paris', country : 'France', continent : 'Europe' } , 
    'cwb1' : { city:'São José dos Pinhais', country : 'Brazil', continent : 'S. America' } , 
    'den1' : { city:'Denver', country : 'United States', continent : 'N. America' } , 
    'dfw1' : { city:'Dallas-Fort Worth', country : 'United States', continent : 'N. America' } , 
    'dme1' : { city:'Moscow', country : 'Russia', continent : 'Europe' } ,
    'doh1' : { city:'Doha', country : 'Quatar', continent : 'Asia' } , 
    'dvn1' : { city:'Davenport', country : 'United States', continent : 'N. America' } , 
    'ewr1' : { city:'Newark', country : 'United States', continent : 'N. America' } ,
    'eze1' : { city:'Buenos Aires', country : 'Argentina', continent : 'S. America' } ,
    'for1' : { city:'Fortaleza', country : 'Brazil', continent : 'S. America' } ,
    'fra1' : { city:'Frankfurt', country : 'Germany', continent : 'Europe' } ,
    'fra2' : { city:'Frankfurt', country : 'Germany', continent : 'Europe' } ,
    'gdl1' : { city:'Guadalajara', country : 'Mexico', continent : 'N. America' } ,
    'gig1' : { city:'Rio De Janeiro', country : 'Brazil', continent : 'S. America' } ,
    'gru1' : { city:'Sao Paulo', country : 'Brazil', continent : 'S. America' } ,
    'hkg1' : { city:'Hong Kong', country : 'Hong Kong', continent : 'Asia' } ,
    'iad' : { city:'Washington', country : 'United States', continent : 'N. America' } ,
    'iad2' : { city:'Ashburn', country : 'United States', continent : 'N. America' } ,
    'ist1' : { city:'Istanbul', country : 'Turkey', continent : 'Europe' } ,
    'jnb1' : { city:'Johannesburg', country : 'South Africa', continent : 'Africa' } ,
    'lax1' : { city:'Los Angeles', country : 'United States', continent : 'N. America' } ,
    'led1' : { city:'St. Petersburg', country : 'Russia', continent : 'Europe' } ,
    'lim1' : { city:'Lima', country : 'Peru', continent : 'S. America' } ,
    'lon1' : { city:'London', country : 'United Kingdom', continent : 'Europe' } ,
    'los1' : { city:'Los Angeles', country : 'United States', continent : 'N. America' } ,
    'mad1' : { city:'Madrid', country : 'Spain', continent : 'Europe' } ,
    'mel1' : { city:'Melbourne', country : 'Australia', continent : 'Oceania' } ,
    'mia' : { city:'Miami', country : 'United States', continent : 'N. America' } ,
    'mia1' : { city:'Miami', country : 'United States', continent : 'N. America' } ,
    'ord' : { city:'Chicago', country : 'United States', continent : 'N. America' } ,
    'ord1' : { city:'Chicago', country : 'United States', continent : 'N. America' } ,
    'otp1' : { city:'Bucharest', country : 'Romania', continent : 'Europe' } ,
    'per1' : { city:'Perth', country : 'Australia', continent : 'Oceania' } ,
    'phx1' : { city:'Phoenix', country : 'United States', continent : 'N. America' } ,
    'pmo1' : { city:'Palermo', country : 'Italy', continent : 'Europe' } ,
    'poa1' : { city:'Porto Alegre', country : 'Brazil', continent : 'S. America' } ,
    'qro1' : { city:'Queretaro', country : 'Mexico', continent : 'N. America' } ,
    'rix1' : { city:'Riga', country : 'Latvia', continent : 'Europe' } ,
    'ruh1' : { city:'Riyadh', country : 'Saudi Arabia', continent : 'Asia' } ,
    'scl1' : { city:'Santiago', country : 'Chile', continent : 'S. America' } ,
    'sea1' : { city:'Seattle', country : 'United States', continent : 'N. America' } ,
    'sin1' : { city:'Singapore', country : 'Singapore', continent : 'Asia' } ,
    'sjc1' : { city:'San Jose - US', country : 'United States', continent : 'N. America'  } ,
    'sjo1' : { city:'San Jose - Costa Rica', country : 'Costa Rica', continent : 'N. America' } ,
    'sju1' : { city:'San Juan', country : 'Puerto Rico', continent : 'N. America' } ,
    'sof1' : { city:'Sofia', country : 'Bulgaria', continent : 'Europe' } ,
    'ssa1' : { city:'Salvador', country : 'Brazil', continent : 'S. America' } ,
    'syd1' : { city:'Sydney', country : 'Australia', continent : 'Oceania' } ,
    'tko' : { city:'Tokyo', country : 'Japon', continent : 'Asia' } ,
    'tko2' : { city:'Tokyo', country : 'Japon', continent : 'Asia' } ,
    'tlv1' : { city:'Tel-aviv', country : 'Israel', continent : 'Asia' } ,
    'uio1' : { city:'Quito', country : 'Ecuador', continent : 'S. America' } ,
    'vno1' : { city:'Vilnius', country : 'Lithuania', continent : 'Europe' } ,
    'waw1' : { city:'Warsaw', country : 'Poland', continent : 'Europe' } ,
    'yyc1' : { city:'Calgary', country : 'Canada', continent : 'N. America' } ,
    'yyz' : { city:'Toronto', country : 'Canada', continent : 'N. America' } ,
    'yyz1' : { city:'Toronto', country : 'Canada', continent : 'N. America' } 
  };

function isoContinent(continent) {
    var iso = continent
    switch (continent) {
        case 'N. America':
            iso = "NA"
            break;
        case 'Europe':
            iso = "EU"
            break;
        case 'S. America':
            iso = "SA"
            break;     
        case 'Asia':
            iso = "AS"
            break;        
        case 'Oceania':
            iso = "OC"
            break; 
        case 'Africa':
            iso = "AF"
            break; 
        default:
            break;
    }
    return iso
}

function callCacheflyApi(in_ouput_dir, in_output_file, in_callback) {
    
    // Check if the file exists in the current directory.
    fs.access(`${in_ouput_dir}/${in_output_file}`, fs.constants.F_OK, (err) => {
        if (err) {
            fs.writeFileSync(`${in_ouput_dir}/${in_output_file}`, JSON.stringify("{}"))
        }

        // retrieve the previous accumulated values
        var previousData = JSON.parse( fs.readFileSync(`${in_ouput_dir}/${in_output_file}`) );

        var from = previousData.lastCall || new Date(new Date() - 2 * 60000).toISOString() //2022-11-17T00:00:00.000Z
        var to = new Date(new Date() - 2 * 60000).toISOString(); //2022-11-17T00:00:00.000Z
        
        // reset the counters at midnight
        if (from[9] != to[9]) {
            previousData.chr = {}
        }
        
        var to_epoch = new Date(new Date() - 2 * 60000).getTime()
        var interval = "1m"
        var offset = 0
        var limit = 10000

        var config = {
            method: 'get',
            url: `${parsedArguments.get("endpoint-chr")}?from=${from}&to=${to}&interval=${interval}&groupBy=pop&offset=${offset}&limit=${limit}`,
            headers: { 
                'Authorization': `Bearer ${parsedArguments.get("cachefly-token")}`
            }
        }

        axios(config)
        .then(function (response) {
            var chr = response.data.data.reduce((acc,cur) => { 
                var p = acc[cur.pop] || { hit : 0, miss : 0};
                p.hit += cur.hit;
                p.miss += cur.miss;
                acc[cur.pop] = p;
                return acc;
            },previousData.chr || {});

            var newData = {
                lastCall : to,
                chr : chr
            }
            // save the new accumulated values
            fs.writeFileSync(`${in_ouput_dir}/${in_output_file}`, JSON.stringify(newData))

            // generate the prometheus data
            var data = []

            // print the pops and their details for dependency in grafana
            data.push(`# HELP ${parsedArguments.get("metrics-prepend")}pops ${parsedArguments.get("metrics-prepend")}pops`)
            data.push(`# TYPE ${parsedArguments.get("metrics-prepend")}pops gauge`)
            Object.entries(POPS).forEach( ([pop,info]) => data.push(`${parsedArguments.get("metrics-prepend")}pops{pop="${pop}",continent="${isoContinent(info.continent)}",country="${info.country}",city="${info.city}"} 1`) )
            
            // print the last timestamp for the next iteration
            data.push(`# HELP last_timestamp ${parsedArguments.get("metrics-prepend")}last_timestamp`)
            data.push(`# TYPE ${parsedArguments.get("metrics-prepend")}last_timestamp counter`)
            data.push(`${parsedArguments.get("metrics-prepend")}last_timestamp ${to_epoch}`);
        
            data.push(`# HELP ${parsedArguments.get("metrics-prepend")}miss ${parsedArguments.get("metrics-prepend")}miss`)
            data.push(`# TYPE ${parsedArguments.get("metrics-prepend")}miss counter`)
            Object.entries(chr).forEach( ([pop,value]) => data.push(`${parsedArguments.get("metrics-prepend")}miss{pop="${pop}", continent="${isoContinent(POPS[pop] ? POPS[pop].continent : "unknown")}", country="${POPS[pop] ? POPS[pop].country : "unknown"}", city="${POPS[pop] ? POPS[pop].city : "unknown"}"} ${value.miss}`) )
            
            data.push(`# HELP ${parsedArguments.get("metrics-prepend")}hit ${parsedArguments.get("metrics-prepend")}hit`)
            data.push(`# TYPE ${parsedArguments.get("metrics-prepend")}hit counter`)
            Object.entries(chr).forEach( ([pop,value]) => data.push(`${parsedArguments.get("metrics-prepend")}hit{pop="${pop}", continent="${isoContinent(POPS[pop] ? POPS[pop].continent : "unknown")}", country="${POPS[pop] ? POPS[pop].country : "unknown"}", city="${POPS[pop] ? POPS[pop].city : "unknown"}"} ${value.hit}`) )
            data.push(null)
            in_callback(data.join("\n"), null)
            
        })
        .catch(function (error) {
            verbose(error)
            in_callback(null, error)
        });
    })
};

// App
const app = express();

function ready() {
    log(`Listening now on port ${parsedArguments.get("nodejs-port")} and path ${parsedArguments.get("nodejs-path")}`)
}

if ( parsedArguments.get("bypass-initial-test") == false) {
    // Some checks, try to run the script
    log("Execute a dry run call as an initial test");
    var test_dir=os.tmpdir();
    var test_file="cachefly-api-to-prometheus.test"
    callCacheflyApi(test_dir, test_file ,(data, error) => {
        fs.unlink(`${test_dir}/${test_file}`, (err) => {console.log(err)})
        if ( data == null || error !== null) {
            throw new Error(`While testing the script: ${error}`); 
        } else {
            app.listen(parsedArguments.get("nodejs-port"), () => {
                log("Dry run ok");
                ready()
            })
        }
    })
} else {
    app.listen(parsedArguments.get("nodejs-port"), () => {
        log("Bypass initial test, no dry run");
        ready()
    })
}

app.get(parsedArguments.get("nodejs-path"), (req, res) => {
    callCacheflyApi(parsedArguments.get("output-dir"), parsedArguments.get("output-file"), (data, error) => {
        if ( data == null || error !== null) {
            res.status(500).send(`${error}`)
        } else {
            res.send(data)
        }
    })
});

