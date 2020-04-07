#!/usr/bin/env bash
PROCESS=$1
while [ : ]
do
    NOW=`date`
    STAT=`ps -p $PROCESS -o cmd,%mem,%cpu | tail -1`
    printf "$NOW\t$STAT\n"
    sleep 60m
    # sleep 1s
done
