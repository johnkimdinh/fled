# FLED - Fantastic LED Thingy
 
## Installation
FLED is designed to be run on a Beaglebone Black to drive a strip of WS2811 LEDs. It uses the PRU to drive the LEDs directly, and needs a bunch of other things to make it work.

### Beaglebone Black Setup

Install Ubuntu on SD Card. You can follow the guide here: http://shrkey.com/setting-up-beaglebone-black-to-boot-off-the-microsd-card/

In short do this:
```bash
wget http://s3.armhf.com/debian/saucy/bone/ubuntu-saucy-13.10-armhf-3.8.13-bone30.img.xz
xz -d ubuntu-saucy-13.10-armhf-3.8.13-bone30.img.xz
diskutil unmountDisk /dev/disk2
sudo dd if=ubuntu-saucy-13.10-armhf-3.8.13-bone30.img of=/dev/disk2 bs=1m
```

Now you are up and running, login to your BBB.

```bash
ssh -l ubuntu 192.168.0.10
```

Time to update and get some things installed:

```bash
sudo apt-get update
sudo apt-get install memcached
sudo apt-get install git
sudo apt-get install libpcre3 libpcre3-dev libssl-dev
```

Now for NodeJS:

```bash
sudo apt-get install -y python-software-properties python g++ make
sudo apt-get install software-properties-common
sudo add-apt-repository -y ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install nodejs
```

We're going to use Nginx to help us push data efficiently into memcached. So lets install that next:

```bash
mkdir nginx-src
cd nginx-src
wget 'http://nginx.org/download/nginx-1.4.3.tar.gz'
tar -xzvf nginx-1.4.3.tar.gz
wget 'https://github.com/agentzh/memc-nginx-module/archive/v0.13.tar.gz'
tar -xzvf v0.13.tar.gz
wget 'https://github.com/agentzh/echo-nginx-module/archive/v0.49.tar.gz'
tar -xzvf v0.49.tar.gz
wget 'https://github.com/agentzh/headers-more-nginx-module/archive/v0.23.tar.gz'
tar -xzvf v0.23.tar.gz

cd nginx-1.4.3
./configure --prefix=/opt/nginx --add-module=../echo-nginx-module-0.49 --add-module=../memc-nginx-module-0.13 --add-module=../headers-more-nginx-module-0.23

make -j2
make install
sudo mkdir /opt/nginx/sites-available
sudo mkdir /opt/nginx/sites-enabled
sudo mkdir /var/log/nginx
```

Now we need to setup the config file for it, open the file `/opt/nginx/conf/nginx.conf` and replace its contents:

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;

    keepalive_timeout  65;

    gzip  on;

    include /opt/nginx/sites-enabled/*;
}
```

Next up we want Nginx to start on boot so lets setup upstart, create a file `/etc/init/nginx.conf`:

```bash
# nginx
 
description "nginx http daemon"
author "George Shammas <georgyo@gmail.com>"
 
start on (filesystem and net-device-up IFACE=lo)
stop on runlevel [!2345]
 
env DAEMON=/opt/nginx/sbin/nginx
env PID=/var/run/nginx.pid
 
expect fork
respawn
respawn limit 10 5
#oom never
 
pre-start script
        $DAEMON -t
        if [ $? -ne 0 ]
                then exit $?
        fi
end script
 
exec $DAEMON
```

Now we can start Nginx for the first time:

```bash
sudo initctl start nginx
```

Now lets install FLED itself:
```bash
cd ~
git clone https://github.com/SupplyFrame/fled.git

cd fled

sudo ln -s ~/fled/nginx.conf /opt/nginx/conf/sites-enabled/fled

sudo initctl restart nginx
```

Finally we want FLED to be started on boot as well, so lets use PM2 for this:

```bash
sudo npm install --global pm2

pm2 start app.js
```
