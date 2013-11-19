FLED Installation
=================

Beaglebone black setup
----------------------

#Install Ubuntu on SD Card:

#http://shrkey.com/setting-up-beaglebone-black-to-boot-off-the-microsd-card/

wget http://s3.armhf.com/debian/saucy/bone/ubuntu-saucy-13.10-armhf-3.8.13-bone30.img.xz
// unzip it
diskutil unmountDisk /dev/disk2
sudo dd if=ubuntu-saucy-13.10-armhf-3.8.13-bone30.img of=/dev/disk2 bs=1m

#....wait

#login
ssh -l ubuntu 192.168.0.10

sudo apt-get update
sudo apt-get install memcached

#install nodejs

sudo apt-get install nodejs

#install nginx

mkdir nginx-src
cd nginx-src
wget 'http://nginx.org/download/nginx-1.4.3.tar.gz'
tar -xzvf nginx-1.4.3.tar.gz
wget 'https://github.com/agentzh/memc-nginx-module/archive/v0.13.tar.gz'
tar -xzvf v0.13.tar.gz
wget 'https://github.com/agentzh/echo-nginx-module/archive/v0.49.tar.gz'
tar -xzvf v0.49.tar.gz

cd nginx-1.4.3
./configure --prefix=/opt/nginx --add-module=../echo-nginx-module-0.49 --add-module=../memc-nginx-module-0.13
make -j2
make install
sudo mkdir /opt/nginx/sites-available
sudo mkdir /opt/nginx/sites-enabled

# setup nginx default config /opt/nginx/conf/nginx.conf
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

#configure upstart output to /etc/init/nginx.conf
#http://wiki.nginx.org/Upstart

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

#start nginx

```bash
sudo initctl start nginx
```

#install git

sudo apt-get install git


#get fled
cd ~
git clone https://github.com/SupplyFrame/fled.git

cd fled

sudo ln -s ./nginx.conf /opt/nginx/conf/sites-enabled/fled

sudo initctl restart nginx

# install pm2 to run the process for us
sudo npm install --global pm2

pm2 start app.js
#start other processes here...

