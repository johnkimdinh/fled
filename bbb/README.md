Compile DTC with -@ option patch

http://www.embedded-things.com/bbb/patching-the-device-tree-compiler-for-ubuntu/

Modify pinmux and enable pru using dtbo
http://www.element14.com/community/community/knode/single-board_computers/next-gen_beaglebone/blog/2013/05/22/bbb--working-with-the-pru-icssprussv2


Create file BB-BONE-PRU-00A0.dts:

```asm
/*  
* pru dts file BB-BONE-PRU-00A0.dts  
*/  
/dts-v1/;  
/plugin/;  
  
/ {  
  compatible = "ti,beaglebone", "ti,beaglebone-black";  
  
  /* identification */  
  part-number = "BB-BONE-PRU";  
  version = "00A0";  
  
  exclusive-use =  
    "P8.12";  
  
  fragment@0 {  
    target = <&am33xx_pinmux>;  
    __overlay__ {  
      mygpio: pinmux_mygpio{  
        pinctrl-single,pins = <  
          0x30 0x06  
          >;  
      };  
    };  
  };  
  
  fragment@1 {  
    target = <&ocp>;  
    __overlay__ {  
      test_helper: helper {  
        compatible = "bone-pinmux-helper";  
        pinctrl-names = "default";  
        pinctrl-0 = <&mygpio>;  
        status = "okay";  
      };  
    };  
  };  
  
  fragment@2{  
  target = <&pruss>;  
    __overlay__ {  
      status = "okay";  
    };  
  };  
};  
```

This enables the PRU and binds the P8.12 pin to it in output mode.

Compile to dtbo file:

```bash
dtc -@ -O dtb -o BB-BONE-PRU-00A0.dtbo BB-BONE-PRU-00A0.dts
```

Copy to /lib/firmware

```bash
sudo cp BB-BONE-PRU-00A0.dtbo /lib/firmware
```

To enable PRU we have to send this into the capemgr:

```bash
sudo su
cd /lib/firmware
echo BB-BONE-PRU > /sys/devices/bone_capemgr.9/slots
```

Now install node-pru and test it out using guide at [https://github.com/omcaree/node-pru]

First install the driver:

```bash
cd ~
git clone https://github.com/beagleboard/am335x_pru_package.git
cd am335x_pru_package
wget http://e2e.ti.com/cfs-file.ashx/__key/telligent-evolution-components-attachments/00-791-00-00-00-23-97-35/attachments.tar.gz
tar -xzf attachments.tar.gz
patch -p1 <  0001-Fix-for-duplicated-interrupts-when-interrupts-are-se.patch 
cd pru_sw/app_loader/interface/
gcc -I. -Wall -I../include   -c -fPIC -O3 -mtune=cortex-a8 -march=armv7-a -shared -o prussdrv.o prussdrv.c
gcc -shared -o libprussdrv.so prussdrv.o
sudo cp libprussdrv.so /usr/lib/
sudo cp ../include/*.h /usr/include/
cd ../../utils/pasm_source
./linuxbuild
sudo cp ../pasm /usr/bin/
```

Test the driver with an example:

```bash
cd ../../example_apps/PRU_memAccess_DDR_PRUsharedRAM
pasm -b PRU_memAccess_DDR_PRUsharedRAM.p
gcc PRU_memAccess_DDR_PRUsharedRAM.c -lprussdrv -lpthread -otest
sudo ./test
```

Now install pru:

```
cd ~
mkdir pru-test
cd pru-test
npm install pru
cd node_modules/pru/examples
pasm -b timing_test.p
sudo node timing_test.js
```