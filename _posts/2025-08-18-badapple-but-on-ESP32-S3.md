---
title: Bad Apple but on ESP32-S3 & SSD1306 OLED
description: I just wanted to test my new OLED screen, and ended up manipulating the partition table :)
# date: 2024-08-14 08:50 PM
---

I just got my first little SSD1306 OLED screen and wanted to do something cool with
it after running some tests. So as any sane person would do, I decided
to show [Bad Apple](https://www.youtube.com/watch?v=9lNZ_Rnr7Jc) on it; just to remember
I don't have enough brain cells left to pull it off by myself. So I searched the web
and found this great project: [hackffm/ESP32_BadApple](https://github.com/hackffm/ESP32_BadApple).
They deserve most of the credit, since everything I did was based on their excellent work.

The repo contains compressed video data, and an Arduino sketch along with a few C++ files
to decompress and display the actual video frames, which are stored on the microcontroller's
flash as a separate filesystem called [SPIFFS](https://github.com/pellepl/spiffs),
along with the code that we upload to the microcontroller. The problem is that SPIFFS data
need to be uploaded manually, as Arduino IDE itself is not quite aware of it.

Fortunately, the repo includes instructions for that, which points us to
[an Arduino plugin](https://github.com/me-no-dev/arduino-esp32fs-plugin)---but
that plugin no longer works with the newer 2.x.x versions of the IDE. Still, nothing stops us from reading
the plugins source code and replicating it's functionality ourselves.

## Getting our feet wet
A skim through [ESP32FS.java](https://github.com/me-no-dev/arduino-esp32fs-plugin/blob/master/src/ESP32FS.java#L379)
reveals that we just need to figure out three steps:
1. [**Read the partition table**](https://github.com/me-no-dev/arduino-esp32fs-plugin/blob/9ef3bcd665b8f9dd227f3eac8b966861cfe5e5a4/src/ESP32FS.java#L212)
   by [opening](https://github.com/me-no-dev/arduino-esp32fs-plugin/blob/9ef3bcd665b8f9dd227f3eac8b966861cfe5e5a4/src/ESP32FS.java#L222) the selected partition
   table's csv file and [looking for](https://github.com/me-no-dev/arduino-esp32fs-plugin/blob/9ef3bcd665b8f9dd227f3eac8b966861cfe5e5a4/src/ESP32FS.java#L233)
   the spiffs entry to figure out it's size and offset into the flash.

1. [**Create an SPIFFS image.**](https://github.com/me-no-dev/arduino-esp32fs-plugin/blob/9ef3bcd665b8f9dd227f3eac8b966861cfe5e5a4/src/ESP32FS.java#L340)
   This is pretty straight forward: Just invoke [`mkspiffs`](https://github.com/igrr/mkspiffs)
   on the sketch's `data/` directory as we see in the plugin code:
```java
if (listenOnProcess(new String[] {
       toolPath,                // Path to the mkspiffs binary
       "-c", dataPath,          // Path to the data directory
       "-p", spiPage+"",        // spiPage = 256 (constant)
       "-b", spiBlock+"",       // spiBlock = 4096 (constant)
       "-s", spiSize+"",        // Read from partition table
       imagePath
}) != 0) // ...
```

1. [**Writing the image to ESP32's flash**](https://github.com/me-no-dev/arduino-esp32fs-plugin/blob/9ef3bcd665b8f9dd227f3eac8b966861cfe5e5a4/src/ESP32FS.java#L374)
   with `esptool.py` (or send it over the network with `espota.py`, in which case
   we don't need to explicitly specify the partition address):
```java
sysExec(new String[] {
       // Path to esptool.py (or a binary executable variant)
       esptool.getAbsolutePath(),

       "--chip", mcu,          // Chip variant (in this case, 'esp32s3'), read from Arduino's configuration
       "--baud", uploadSpeed,  // The upload speed to use, read from Arduino's configuration

       // The serial port that is connected to the micro, read from Arduino
       // (e.g. /dev/ttyACM0, /dev/ttyUSB0, or something else on other OSes)
       "--port", serialPort,

       "--before", "default_reset",
       "--after", "hard_reset",
       "write_flash",
       "-z",  // Compress data in transfer

       // The flash mode to use (and set), read from Arduino's configuration
       // (See https://docs.espressif.com/projects/esptool/en/latest/esp32/advanced-topics/spi-flash-modes.html)
       "--flash_mode", flashMode,

       // The flash frequency to use (and set), read from Arduino's configuration
       // (See https://docs.espressif.com/projects/esptool/en/latest/esp32s3/esptool/flash-modes.html#flash-frequency-flash-freq-ff)
       "--flash_freq", flashFreq,

       // The flash size to set
	   // (See https://docs.espressif.com/projects/esptool/en/latest/esp32s3/esptool/flash-modes.html#flash-size-flash-size-fs)
       "--flash_size", "detect",

	   // The address to begin writing the image to (read from the partition table)
       ""+spiStart,
	
       imagePath
});
```
   Before panicking: many of these flags are not required. `-z` is enabled by default,
   flash options can be ommited to use device defaults, chip type can be detected automatically,
   and `--before` and `--after` flags are not quite necessary as the chip will be
   hard-reset after `write_flash` anyway.

### Reading the partition table
The partition table is set by the Arduino IDE when writing the firmware on the flash.
So to know what partition table is currently being written, There are a couple of options:
1. **See what Arduino is configured to use** by looking in the `Tools` menu:
   ![tools_menu](/assets/bad-apple-esp32s3/tools-menu.png) then search Arduino package files
   for the partition table's csv file. They are located somewhere like
   `~/.arduino15/packages/esp32/hardware/esp32/x.y.z/tools/partitions/`:
```sh
$ ls ~/.arduino15/packages/esp32/hardware/esp32/3.2.0/tools/partitions/
app3M_fat9M_16MB.csv              esp_sr_16.csv                               minimal.csv                  tinyuf2-partitions-16MB-noota.csv
app3M_fat9M_fact512k_16MB.csv     ffat.csv                                    min_spiffs.csv               tinyuf2-partitions-4MB.csv
app3M_spiffs9M_fact512k_16MB.csv  huge_app.csv                                no_fs.csv                    tinyuf2-partitions-4MB-noota.csv
bare_minimum_2MB.csv              large_fat_32MB.csv                          noota_3g.csv                 tinyuf2-partitions-8MB.csv
boot_app0.bin                     large_ffat_8MB.csv                          noota_3gffat.csv             tinyuf2-partitions-8MB-noota.csv
default_16MB.csv                  large_littlefs_32MB.csv                     no_ota.csv                   zigbee_2MB.csv
default_32MB.csv                  large_spiffs_16MB.csv                       noota_ffat.csv               zigbee_8MB.csv
default_8MB.csv                   large_spiffs_8MB.csv                        ota_nofs_4MB.csv             zigbee.csv
default.bin                       m5stack_partitions_16MB_factory_4_apps.csv  rainmaker_4MB_no_ota.csv     zigbee_zczr_2MB.csv
default.csv                       m5stack_partitions_16MB_factory_6_apps.csv  rainmaker_8MB.csv            zigbee_zczr_8MB.csv
default_ffat_8MB.csv              max_app_4MB.csv                             rainmaker.csv                zigbee_zczr.csv
default_ffat.csv                  max_app_8MB.csv                             tinyuf2-partitions-16MB.csv
```
   In this case, it is the `default.csv`. However if you are unsure, you can
   use the second method below.

2. or **Read the partition table directly from the flash**. There is an offset into
   the flash where the partition table is written in binary which varies between different
   [configurations](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/kconfig-reference.html#config-partition-table-offset),
   but the [default offset](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/partition-tables.html)
   is `0x8000` and the table size is `0xC00` bytes.

   Knowing that, we can continue by dumping that section into a file:
```sh
esptool.py --port /dev/ttyACM0 read_flash 0x8000 0xc00 partition-table.bin
```
   Then, we parse the binary to csv:
```sh
gen_esp32part.py partition-table.bin
```
   (The `gen_esp32part.py` script is included with ESP-IDF and Arduino's ESP32 package.
   You can try searching for it in the Arduino package files if you have trouble finding it)


Anyhow, you should now have a csv file which looks like this:
```csv
# Name,   Type, SubType, Offset,  Size, Flags
nvs,      data, nvs,     0x9000,  0x5000,
otadata,  data, ota,     0xe000,  0x2000,
app0,     app,  ota_0,   0x10000, 0x140000,
app1,     app,  ota_1,   0x150000,0x140000,
spiffs,   data, spiffs,  0x290000,0x160000,
coredump, data, coredump,0x3F0000,0x10000,
```
Just note down the `Offset` and `Size` fields of the `spiffs` partition.
Depending in the method you used to get this csv table, these numbers might
be in hex, decimal and may or may not have postfixes. Remember to assume
[binary prefixes](https://en.wikipedia.org/wiki/Binary_prefix) (e.g 1024
instead of 1000) for the postfixes. Also, all these values are in bytes.

### Creating the SPIFFS image
Easy, just run this and make sure to replace the number after `-s` with
whatever SPIFFS partition size you had:
```sh
mkspiffs -c data/ -p 256 -b 4096 -s 1441792 spiffs.bin
```
(Again, `mkspiffs` is included in Arduino package files)

### Write the image to ESP32's flash
At this point, this is also pretty easy to do (Don't froget to replace `2686976`
with your SPIFFS partition offset):
```sh
esptool.py               \
  --chip esp32s3         \
  --baud 921600          \
  --port /dev/ttyACM0    \
  --before default_reset \
  --after hard_reset     \
  write_flash            \
  -z                     \
  --flash_mode qio       \
  --flash_freq 80m       \
  --flash_size detect    \
  2686976 ./spiffs.bin
```
All these values can be gathered from the same `Tools` menu mentioned above.
But remember, this command can be simplified since alot of these flags are
not mandatory:
```sh
esptool.py --baud 921600 --port /dev/ttyACM0 write_flash 2686976 ./spiffs.bin
```
(I kept `--baud` because the default rate was too slow. If you experience any weired
behavior, consider removing this flag or using lower baud rates.)

## Final thoughts
Although this method works perfectly fine for this example, there are many other
[options](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/file-system-considerations.html)
when it comes to mounting a filesystem on the ESP32, such as
[FatFS](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/file-system-considerations.html#fatfs-fs-section) or
[LittleFS](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/file-system-considerations.html#littlefs-fs-section)
which can both operate on the SPI flash as well as on an SD card. They also
[perform](https://github.com/espressif/esp-idf/tree/v5.5/examples/storage/perf_benchmark)
differently. So you might want to choose a different one depending on your needs.

## Epilogueealisdjaewr?
Finally, it's time to enjoy watching Bad Apple on the OLED screen with a cup of warm
coffee ☕.

<video width="100%" controls>
  <source src="/assets/bad-apple-esp32s3/hero.mp4" type="video/mp4">
</video>

The only thing it lacks, is the audio was added on top of the video with editing software.
I really hope some day I comeback to this type of stuff and maybe make a version with audio.
Until then!
