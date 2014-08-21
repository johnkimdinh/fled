### Install NodeJS

Now for NodeJS:

```bash
wget http://nodejs.org/dist/v0.10.2/node-v0.10.2-linux-arm-pi.tar.gz
tar -xvzf node-v0.10.2-linux-arm-pi.tar.gz
node-v0.10.2-linux-arm-pi/bin/node --version
sudo ln -sf /home/pi/node-v0.10.2-linux-arm-pi/bin/npm /usr/bin/npm
sudo ln -sf /home/pi/node-v0.10.2-linux-arm-pi/bin/node /usr/bin/node
npm install -g node-gyp
```

### Setup NTP

To install things that require native compilation we need an accurate system clock. So lets get NTP working, create the file `/etc/rc.conf`:

```bash
DAEMONS=(!hwclock ntpd)
```

Then issue:

```bash
sudo ln -sf /usr/share/zoneinfo/America/Los_Angeles /etc/localtime
```

To get your timezone setup correctly....
```bash
sudo service ntp stop
sudo apt-get install ntpdate
ntpdate ntp.vpc.supplyframe.com
```

### SysVinit
Alternatively to upstart, we can use SysVinit, its similar but slightly different, but is easier on Debian (Raspbian), create the following script at `/etc/init.d/nginx`:

```bash
#! /bin/sh
 
### BEGIN INIT INFO
# Provides:          nginx
# Required-Start:    $all
# Required-Stop:     $all
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: starts the nginx web server
# Description:       starts nginx using start-stop-daemon
### END INIT INFO
 
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
DAEMON=/opt/nginx/sbin/nginx
NAME=nginx
DESC=nginx
 
test -x $DAEMON || exit 0
 
# Include nginx defaults if available
if [ -f /etc/default/nginx ] ; then
    . /etc/default/nginx
fi
 
set -e
 
. /lib/lsb/init-functions
 
case "$1" in
  start)
    echo -n "Starting $DESC: "
    start-stop-daemon --start --quiet --pidfile /usr/local/nginx/logs/$NAME.pid \
        --exec $DAEMON -- $DAEMON_OPTS || true
    echo "$NAME."
    ;;
  stop)
    echo -n "Stopping $DESC: "
    start-stop-daemon --stop --quiet --pidfile /usr/local/nginx/logs/$NAME.pid \
        --exec $DAEMON || true
    echo "$NAME."
    ;;
  restart|force-reload)
    echo -n "Restarting $DESC: "
    start-stop-daemon --stop --quiet --pidfile \
        /usr/local/nginx/logs/$NAME.pid --exec $DAEMON || true
    sleep 1
    start-stop-daemon --start --quiet --pidfile \
        /usr/local/nginx/logs/$NAME.pid --exec $DAEMON -- $DAEMON_OPTS || true
    echo "$NAME."
    ;;
  reload)
      echo -n "Reloading $DESC configuration: "
      start-stop-daemon --stop --signal HUP --quiet --pidfile /usr/local/nginx/logs/$NAME.pid \
          --exec $DAEMON || true
      echo "$NAME."
      ;;
  status)
      status_of_proc -p /usr/local/nginx/logs/$NAME.pid "$DAEMON" nginx && exit 0 || exit $?
      ;;
  *)
    N=/etc/init.d/$NAME
    echo "Usage: $N {start|stop|restart|reload|force-reload|status}" >&2
    exit 1
    ;;
esac
 
exit 0
```

Now issue the following commands to configure the script to be executable, and setup sysVinit to execute on startup:

```bash
sudo chmod +x /etc/init.d/nginx
sudo /usr/sbin/update-rc.d -f nginx defaults
sudo /etc/init.d/nginx start
```

### Setting up WIFI

Follow [these instructions](http://www.marcomc.com/2012/09/how-to-configure-wireless-lan-on-raspberrypi-with-raspbian-kernel-3-2-27-and-solwise-rtl8188cus-wifi-dongle/) to get wifi working on your raspberry pi.

### NTP at SupplyFrame

Supplyframe have an internal ntp server which you will need to configure the pi to use, try this:


### Installing Cairo
First we need to install Cairo so we can use node-canvas for image loading.

```bash
sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
```