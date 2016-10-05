#!/bin/bash

rm -f planet.db planet.err planet.out;
nohup bash -c "(cat /data/polyline/planet.polylines | time -p node import.js /data/planet.db >planet.out) &> planet.err" &
