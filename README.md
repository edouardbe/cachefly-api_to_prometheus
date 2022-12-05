# Cachefly API to Prometheus Data

This project aims to leverage the Cachefly API and transform the data into a format undestandable by Prometheus, with counters gauges and so on.

The only required parameter you need is the Cachefly Bearer Token to authenticate the calls to the Cachefly API. You can generate it from the Cachefly portal.

The project is split into :
- a nodejs application (/nodejs) turning on an express server, waiting calls to call the Cachefly API, aggregate the values, transform them into a Prometheus format and return the data.
- a service (/service) to run the nodejs app as a service
- a Makefile if you want to build a deb package (for amd64). The package folder is used to create the deb package
- a Dockerfile if you prefer to run the nodejs app using Docker.

You have to give the Cachefly Bearer Token to the nodejs app: 
- either as a command-line argument --cachefly-token 
- or as environment variable CATP_CACHEFLY_TOKEN=abc
- or in a configuration file using the key CATP_CACHEFLY_TOKEN=abc
I would recommend using the configuration file. 

A sample configuration file is attached : sample_config.txt.


## Using Docker
Build the image 
    docker build -t cachefly_metrics_exporter:1.0.0 .

Copy/Paste/Modify the sample configuration file
    cp sample_config.txt config.txt
    # add the token as CATP_CACHEFLY_TOKEN=abc

Run the container, detached, specify the port and link the external configuration file
    docker container run --name cachefly_metrics_exporter -p 9145:9145 -v /path/to/you/configuration/file/config.txt:/app/config.txt:ro ccachefly_metrics_exporter:1.0.0

Test
    curl http://localhost:9145/metrics


## Using Deb package 
Build the Deb package
    make

Copy the .deb package on the target server
Install the .deb package
    sudo dpkg -i cachefly_metrics_exporter__1.0-1_amd64.deb

Copy/Paste/Modify the sample configuration file
    cp /etc/cachefly_metrics_exporter/sample_config.txt /etc/cachefly_metrics_exporter/config.txt
    # add the token as CATP_CACHEFLY_TOKEN=abc

Start the service
    sudo service cachefly_metrics_exporter start

Check the status
    sudo service cachefly_metrics_exporter status

Test the service
    curl http://localhost:9145/metrics
