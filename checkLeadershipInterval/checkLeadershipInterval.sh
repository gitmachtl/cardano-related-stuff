#!/usr/bin/env bash

if [[ $# -eq 1 && ! $1 == "" ]]; then logFile=${1}; else echo -e "\e[33mUsage: \e[0m$0 <Path_to_BP_Node_JSON_LogFile>\n"; exit 2; fi

if [ ! -f "${logFile}" ]; then echo -e "\e[35mError: \e[0m\"${logFile}\" does not exist!\n"; exit 2; fi

echo "Using Log file: ${1}"

#get the first slotNo
prevline=$(cat ${1} | grep -m1 TraceStartLeadershipCheck | jq -r .data.slot)

echo -e "Tracing now in realtime ...\n"

#now tail it in realtime
tail -Fn9999999 ${1} 2> /dev/null | \
while read line ; do

    tmp=$(echo "$line" | grep TraceStartLeadershipCheck 2>/dev/null)
    if [ $? = 0 ]; then
        newline=$(echo "$line" | jq -r .data.slot)
        diff=$((newline-prevline))
        if [[ ${diff} -gt 1 ]]; then
        echo -e "\n\e[35mSlotDiff(!): $newline(new) $prevline(old) ${diff}(missing)\e[0m"
        else
        echo -ne "\rOK: $newline(new) $prevline(old)\033[K"
        fi
        prevline=$newline
    fi

    tmp=$(echo "$line" | grep TookSnapshot 2>/dev/null)
    if [ $? = 0 ]; then
        snapshotTip=$(echo "$line" | jq -r .data.tip)
        echo -e "\r\e[90mSnapshot: ${snapshotTip}\e[0m"
    fi

    tmp=$(echo "$line" | grep TraceForgedBlock 2>/dev/null)
    if [ $? = 0 ]; then
        newMadeBlock=$(echo "$line" | sed "s/\"\[\"/\[\"/g" | sed "s/\"\]\"/\"\]/g" | jq -r .data.val.block)
        slotNum=$(echo "$line" | sed "s/\"\[\"/\[\"/g" | sed "s/\"\]\"/\"\]/g" | jq -r .data.val.slot)
        echo -e "\r\e[32m New Minted Block: ${newMadeBlock} (SlotNo ${slotNum})\e[0m"
    fi

    tmp=$(echo "$line" | grep TraceAdoptedBlock 2>/dev/null)
    if [ $? = 0 ]; then
        newAdoptedBlock=$(echo "$line" | sed "s/\"\[\"/\[\"/g" | sed "s/\"\]\"/\"\]/g" | jq -r .data.val.blockHash)
        slotNum=$(echo "$line" | sed "s/\"\[\"/\[\"/g" | sed "s/\"\]\"/\"\]/g" | jq -r .data.val.slot)
        echo -e "\r\e[32mNew Adopted Block: ${newAdoptedBlock} (SlotNo ${slotNum})\e[0m"
    fi

done

