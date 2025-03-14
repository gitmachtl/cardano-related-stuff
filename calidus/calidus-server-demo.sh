#!/bin/bash

############################################################
#                ___     __
#    _________ _/ (_)___/ /_  _______
#   / ___/ __ `/ / / __  / / / / ___/
#  / /__/ /_/ / / / /_/ / /_/ (__  )
#  \___/\__,_/_/_/\__,_/\__,_/____/
#
# DEMO-Script to showcase a typical server/application workflow
#
# Usage: ./calidus-server-demo.sh mainnet|preview|sanchonet
#
############################################################

case $# in

  1 ) #Network name was provided, set the koios api endpoint
	case "${1}" in
		"mainnet")	koiosAPI="https://api.koios.rest/api/beta";;
		"preview")	koiosAPI="https://preview.koios.rest/api/beta";;
		"sanchonet")	koiosAPI="https://sancho.koios.rest/api/v1";;
		*)		echo -e "ERROR - Unknown network '${1}', please choose from 'mainnet, preview or sanchonet'"; exit 1;;
	esac ;;

  * )	echo -e "USAGE - Please provide the network 'mainnet, preview or sanchonet' as parameter like:\n${0} mainnet"; exit 1;;

esac

### Little helper
versionCheck() { printf '%s\n%s' "${1}" "${2}" | sort -C -V; } #$1=minimal_needed_version, $2=provided_version

### Binary paths
cardanosigner="./cardano-signer"

### Check that cardanosigner is installed
cardanosignerCheck=$(${cardanosigner} --version 2> /dev/null)
if [[ $? -ne 0 ]]; then echo -e "\e[35mSORRY - This script needs a working 'cardano-signer' binary. Please make sure you have it present with with the right path !\e[0m\n"; exit 1; fi
cardanosignerVersion=$(echo ${cardanosignerCheck} | cut -d' ' -f 2)
versionCheck "1.24.0" "${cardanosignerVersion}"
if [[ $? -ne 0 ]]; then echo -e "\e[35mSORRY - Please use a cardano-signer version 1.24.0 or higher !\e[0m\n"; exit 1; fi

### ----------------------------------------------------------------------------------------


### Welcome message
echo -e "\n\e[0m----- Calidus Server-Side Demo -----\n"

### Get the latest list of registered Calidus Pool Keys
echo -ne "\e[90mQuery registered Calidus-Keys from koios api \e[32m${koiosAPI}/pool_calidus_keys\e[0m ... ";
calidusKeysJSON=$(curl -sL -m 30 -X GET "${koiosAPI}/pool_calidus_keys?pool_status=eq.registered" -H "Accept: application/json" 2> /dev/null)
if [[ $? -ne 0 || $(jq ". | length" 2> /dev/null <<< ${calidusKeysJSON}) -eq 0 ]]; then echo -e "\e[35mSORRY, something went wrong: '${calidusKeysJSON}' \e[0m\n"; exit 1; fi
echo -e "\e[32mok\e[0m\n"

### Ask the SPO to input his/her Calidus-ID or Pool-ID until we got a calidusPublicKey result
while true; do

	echo -e "\e[94mHello dear SPO, can you please provide your Calidus-ID or Pool-ID (CTRL+C to exit):\e[0m"
	read -e -p "" inputID
	### Check the calidusKeyJSON about the entered ID
	poolIdListJSON=$(jq -r "[ .[] | select( .calidus_id_bech32 == \"${inputID}\" or .pool_id_bech32 == \"${inputID}\" ) ]" <<< ${calidusKeysJSON} 2> /dev/null)
	poolIdListCount=$(jq -r "length // 0" <<< ${poolIdListJSON} 2> /dev/null)
	if [[ $? -eq 0 && ${poolIdListCount} -ge 1 ]]; then
		### We have one or more entries. List the Pool-IDs and get the Calidus Public Key
		echo -e "\n\e[94mThx, there are ${poolIdListCount} pools registered:\e[0m"
		jq -r ".[].pool_id_bech32" <<< ${poolIdListJSON} 2> /dev/null
		break; #we found at least one entry, exit the while loop
	fi
	### We did not find an entry, go back and ask the SPO again
	echo -e "\n\e[35mSorry, couldn't find any entries for '${inputID}'. Please try again ...\e[0m\n"

done

### Get the Calidus Public Key from the list
calidusPublicKey=$(jq -r ".[0].calidus_pub_key" <<< ${poolIdListJSON} 2> /dev/null)
if [[ "${calidusPublicKey}" =~ ^([[:xdigit:]][[:xdigit:]]){64}$ ]]; then echo -e "\e[94mSORRY, thats not a valid Calidus Public Key '${calidusPublicKey}' \e[0m\n"; exit 1; fi

### Generate a uniq message to sign for the SPO (just generate a message with some random parts in it, not a static one)
message=$(cat /proc/sys/kernel/random/uuid); message=${message//-/}; message=${message^^}
echo -e "\n\e[94mCan you please sign the following message with your Calidus-Secret-Key:\e[0m\n${message}\n"
echo -e "\e[90mExample: ${cardanosigner} sign --data-text \"${message}\" --secret-key myKey.calidus.skey\e[0m\n"

### Ask the SPO to input the signature
echo -e "\e[94mPlease enter your signature (CTRL+C to exit):\e[0m"
read -e -p "" signature
signature=$(cut -d' ' -f 1 <<< ${signature}) #get the first part before the space in case the SPO pastes to much

### Verify the provided signature
echo -e "\n\e[90mVerify the signature using Cardano-Signer Version: \e[32m${cardanosignerVersion}\e[0m";
result=$(${cardanosigner} verify --data-text "${message}" --public-key "${calidusPublicKey}" --signature "${signature}" 2> /dev/null)
if [[ "${result}" != "true" ]]; then echo -e "\n\e[35mSORRY - Your calidus key is NOT valid, can't let you login !\e[0m\n"; exit 1; fi

### SUCCESSFUL Calidus Key Authentication/Verification
echo -e "\n\e[32mTHANK YOU - Your Calidus Key is valid - Authentication/Login successful !\e[0m\n"


