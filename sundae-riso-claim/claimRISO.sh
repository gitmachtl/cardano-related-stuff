#!/bin/bash

#------------------------------------------------------------------------------------------------------------
#-
#- Short script to claim SundaeSwap RISO Rewards
#- Syntax: claimRISO.sh <stakeAddress> <stake.skey> <paymentAddress> <payment.skey>
#-
#- Brought to you by:
#-	Github - https://github.com/gitmachtl
#-	Telegram - @atada_stakepool
#-	Twitter - @ATADA_Stakepool
#-	Discord - MartinLang [ATADA, SPO Scripts]#5306
#-
#------------------------------------------------------------------------------------------------------------


#------------------------------------------------------------------------------------------------------------
#-
#- PATHS TO THE BINARIES
#-
#------------------------------------------------------------------------------------------------------------

#Location of cardano-cli - set it to "cardano-cli" if its in your $PATH or otherwise provide the location
cardanocli="./cardano-cli"












#------------------------------------------------------------------------------------------------------------
#-
#- DON'T EDIT BELOW THIS LINE
#-
#------------------------------------------------------------------------------------------------------------

#Constants
sundaeAPI="https://api.sundae-rewards.sundaeswap.finance/api/v0"
koiosAPI="https://api.koios.rest/api/v0"
transactionExplorer="https://cardanoscan.io/transaction"

addrTypePayment="payment"
addrTypeStake="stake"

#TempDir Path
tempDir=$(dirname $(mktemp -ut tmp.XXXX))

#DisplayMajorErrorMessage
majorError() {
echo -e "\e[97m\n"
echo -e "         _ ._  _ , _ ._\n        (_ ' ( \`  )_  .__)\n      ( (  (    )   \`)  ) _)\n     (__ (_   (_ . _) _) ,__)\n         \`~~\`\\ ' . /\`~~\`\n              ;   ;\n              /   \\ \n_____________/_ __ \\___________________________________________\n"
echo -e "\e[35m${1}\n\nIf you think all is right at your side, please check the GitHub repo if there\nis a newer version/bugfix available, thx: https://github.com/gitmachtl/scripts\e[0m\n"; exit 1;
}

#Check Command existance
exists() {
 command -v "$1" >/dev/null 2>&1
}

#Displays an Errormessage if parameter is not 0
checkError()
{
if [[ $1 -ne 0 ]]; then echo -e "\n\n\e[35mERROR (Code $1) !\e[0m\n"; exit $1; fi
}

#AddressType check
check_address() {
	tmp=$(${cardanocli} address info --address $1 2> /dev/null)
	if [[ $? -ne 0 ]]; then echo -e "\e[35mERROR - Unknown address format for address: $1 !\e[0m"; exit 1; fi
	era=$(jq -r .era <<< ${tmp} 2> /dev/null)
	if [[ "${era^^}" == "BYRON" ]]; then echo -e "\e[33mINFO - Byron addresses are only supported as a destination address!\e[0m\n"; fi
}

get_addressType() {
${cardanocli} address info --address $1 2> /dev/null | jq -r .type
}

#Convert Sundae
convertToSundae() {
printf "%'.6f" "${1}e-6" #return SUNDAE (with 6 commas)
}

#Subroutine for user interaction
ask() {
    local prompt default reply

    if [ "${2:-}" = "Y" ]; then
        prompt="Y/n"
        default=Y
    elif [ "${2:-}" = "N" ]; then
        prompt="y/N"
        default=N
    else
        prompt="y/n"
        default=
    fi

    while true; do

        # Ask the question (not using "read -p" as it uses stderr not stdout)
        echo -ne "$1 [$prompt] "

        # Read the answer (use /dev/tty in case stdin is redirected from somewhere else)
        read reply </dev/tty

        # Default?
        if [ -z "$reply" ]; then
            reply=$default
        fi

        # Check if the reply is valid
        case "$reply" in
            Y*|y*) return 0 ;;
            N*|n*) return 1 ;;
        esac

    done
}



#------------------------------------------------------------------------------------------------------------
#-
#- Main Start
#-
#------------------------------------------------------------------------------------------------------------

#Check command line parameter
if [ $# -ne 4 ]; then
cat >&2 <<EOF

Usage: $(basename $0) <StakeAddress> <PathToStake.skey> <PaymentAddress> <PathToPayment.skey>


Parameters:

         StakeAddress) The stake1... address which was delegated to a RISO pool at the time
     PathToStake.skey) The path to the stake.skey file for the StakeAddress (needed to sign the transaction)
       PaymentAddress) The addr1... address that is receiving the RISO rewards SUNDAE token and that pays for the fees
   PathToPayment.skey) The path to the payment.skey file for the PaymentAddress (needed to sign the transaction)

   Please use a small CLI payment wallet (~5 Ada) for that, don't use your plegde/owner wallet or a big one.


Example:

   $(basename $0) stake1uypayp2nyzy66tmcz6yjuth59pym0df83rjpk0758fhqrncq8vcdz stake.skey addr1v9ux8dwy800s5pnq327g9uzh8f2fw98ldytxqaxumh3e8kqumfr6d payment.skey


EOF
exit 1;
fi

#Check the cardano-cli binary existance
if ! exists "${cardanocli}"; then
                                #Try to find it via "which"
				cardanocli=$(which cardano-cli)
                                if ! exists "${cardanocli}"; then majorError "Path ERROR - Path to the 'cardano-cli' binary is not correct or 'cardano-cli' binaryfile is missing!\nYou can find it here: https://github.com/input-output-hk/cardano-node"; exit 1; fi
fi


#Check if curl & jq is installed
if ! exists curl; then echo -e "\e[33mYou need the little tool 'curl', its needed to fetch online data !\n\nInstall it on Ubuntu/Debian like:\n\e[97msudo apt update && sudo apt -y install curl\n\n\e[33mThx! :-)\e[0m\n"; exit 1; fi
if ! exists jq; then echo -e "\e[33mYou need the little tool 'jq', its needed to do the json processing !\n\nInstall it on Ubuntu/Debian like:\n\e[97msudo apt update && sudo apt -y install jq\n\n\e[33mThx! :-)\e[0m\n"; exit 1; fi
#if ! exists xxd; then echo -e "\e[33mYou need the little tool 'xxd', its needed to do the hex/binary conversion !\n\nInstall it on Ubuntu/Debian like:\n\e[97msudo apt update && sudo apt -y install xxd\n\n\e[33mThx! :-)\e[0m\n"; exit 1; fi


#Get parameters
stakeAddr="${1}"
stakeSKEY="${2}"
paymentAddr="${3}"
paymentSKEY="${4}"


#Check addresses
check_address ${stakeAddr}; typeOfAddr=$(get_addressType ${stakeAddr}); checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi;
if [[ ${typeOfAddr} != ${addrTypeStake} ]]; then echo -e "\e[35mERROR - The given StakeAddress is not a valid one!\e[0m"; exit 1; fi
check_address ${paymentAddr}; typeOfAddr=$(get_addressType ${paymentAddr}); checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi;
if [[ ${typeOfAddr} != ${addrTypePayment} ]]; then echo -e "\e[35mERROR - The given PaymentAddress is not a valid one!\e[0m"; exit 1; fi


#Check file existance of the SKEY files
if [ ! -f "${stakeSKEY}" ]; then echo -e "\e[35mERROR - ${stakeSKEY} does not exist!\e[0m"; exit 1; fi
if [ ! -f "${paymentSKEY}" ]; then echo -e "\e[35mERROR - ${paymentSKEY} does not exist!\e[0m"; exit 1; fi


#Ok, lets start
echo
echo -e "\e[0mClaiming Sundae RISO Rewards for stake address: \e[32m ${stakeAddr}\e[0m"
echo


#Request available rewards information from SundaeSwap
echo -e "\e[0mCheck if there are rewards available via ${sundaeAPI}/rewards:\e[0m"
echo -ne "\e[0mQuery ... "
response=$(curl -s -m 20 -X POST "${sundaeAPI}/rewards" --data "{\"addresses\": [\"${stakeAddr}\"]}" 2> /dev/null)

#Check if the received json is a valid one
tmp=$(jq . <<< ${response} 2> /dev/null); if [[ $? -ne 0 ]]; then echo -e "\e[35mError during rewards query!\n\e[0m"; exit 1; fi
echo -e "\e[32mDONE\e[0m"
echo

#Filter for already claimed rewards -> seenTxID is set for the entry
rewardsClaimed=$(jq -r "[ .rewards | flatten | .[] | select ( .seenTxId != \"\" ) ]" <<< ${response} 2> /dev/null)
rewardsClaimedLength=$(jq -r "length" <<< ${rewardsClaimed})
for (( tmpCnt=0; tmpCnt<${rewardsClaimedLength}; tmpCnt++ ))
do
	purpose=$(jq -r ".[${tmpCnt}].purpose" <<< ${rewardsClaimed})
	amount=$(jq -r ".[${tmpCnt}].amount" <<< ${rewardsClaimed})
	echo -e "\e[0mRewards already claimed (${purpose}): \e[32m$(convertToSundae ${amount}) SUNDAE\e[0m"
done
echo

#Filter out already claimed rewards -> seenTxID is empty for the entry
rewardsAvailable=$(jq -r "[ .rewards | flatten | .[] | select ( .seenTxId == \"\" ) ]" <<< ${response} 2> /dev/null)
rewardsAvailableLength=$(jq -r "length" <<< ${rewardsAvailable})
if [[ ${rewardsAvailableLength} -eq 0 ]]; then echo -e "\e[35mNo rewards available!\n\e[0m"; exit 0; fi
for (( tmpCnt=0; tmpCnt<${rewardsAvailableLength}; tmpCnt++ ))
do
	purpose=$(jq -r ".[${tmpCnt}].purpose" <<< ${rewardsAvailable})
	amount=$(jq -r ".[${tmpCnt}].amount" <<< ${rewardsAvailable})
	echo -e "\e[0mRewards available (${purpose}): \e[33m$(convertToSundae ${amount}) SUNDAE\e[0m"
done
echo

#Get UTXO Information for the payment address via koios
echo -e "\e[0mGet UTXOs for address \e[32m${paymentAddr}\e[0m via ${koiosAPI}/address_info:\e[0m"
echo -ne "\e[0mQuery ... "
response=$(curl -s -m 20 -X POST "${koiosAPI}/address_info"  -H "Accept: application/json"  -H "Content-Type: application/json"  -d "{\"_addresses\":[\"${paymentAddr}\"]}")
#check if the received json is a valid one
tmp=$(jq . <<< ${response} 2> /dev/null); if [[ $? -ne 0 ]]; then echo -e "\e[35mError during UTXO query!\n\e[0m"; exit 1; fi
echo -e "\e[32mDONE\e[0m"
echo

echo -e "\e[0mOnly selecting UTXOs without Assets ..."

#Selecting only utxos without assets on it
utxoSet=$(jq -r "[ .[0].utxo_set[] | select( .\"asset_list\" == [] ) ]" <<< ${response})
utxoSetLength=$(jq -r "length" <<< ${utxoSet})

#Select utxos until we have at least 2 ADA (2000000 lovelaces) of utxo inputs
inputList=""
utxoSum=0
for (( tmpCnt=0; tmpCnt<${utxoSetLength}; tmpCnt++ ))
do
	tx_hash=$(jq -r ".[${tmpCnt}].tx_hash" <<< ${utxoSet})
	tx_index=$(jq -r ".[${tmpCnt}].tx_index" <<< ${utxoSet})
	value=$(jq -r ".[${tmpCnt}].value" <<< ${utxoSet})
	inputList+="{\"txId\": \"${tx_hash}\",\"index\": ${tx_index}},"
	echo -e "\e[0m- using UTXO [${tmpCnt}]:\t${tx_hash}#${tx_index}\t${value} lovelaces"
	utxoSum=$(( ${utxoSum} + ${value} ));
	if [[ ${value} -ge 5000000 ]]; then break; fi #if we already have 5 ADA, stop it
done
if [[ ${value} -lt 5000000 ]]; then echo -e "\n\e[35mNot enough funds on the payment address, you need at least 5 ADA on it!\n\e[0m"; exit 0; fi
inputList=${inputList%?} #remove the last ',' char at the end
echo -e "\e[32mDONE\e[0m"

#Request the claiming transaction from SundaeSwap
echo
echo -e "\e[0mRequesting the txCborHex from ${sundaeAPI}/rewards/claim:\e[0m"

echo -ne "\e[0mQuery ... "
response=$(curl -s -m 20 -X POST "${sundaeAPI}/rewards/claim" --data "{ \"addresses\": [\"${stakeAddr}\"], \"returnAddress\": \"${paymentAddr}\", \"inputs\": [ ${inputList} ] }" 2> /dev/null)
#Check if the received json is a valid one
tmp=$(jq . <<< ${response} 2> /dev/null); if [[ $? -ne 0 ]]; then echo -e "\e[35mError during tx-raw request!\n\e[0m"; exit 1; fi
echo -e "\e[32mDONE\e[0m"
echo


#Generate the tx-raw json for cardano-cli
txRawFile="${tempDir}/tx.raw"
echo -e "\e[0mConverting into cardano-cli readable tx-raw format:\e[32m ${txRawFile}\e[0m"
txCborHex=$(jq -r ".txCborHex" <<< ${response} 2> /dev/null)
if [[ $? -ne 0 ]]; then echo -e "\e[35mError during tx-raw conversion!\n\e[0m"; exit 1; fi
txFile=$(jq ".cborHex = \"${txCborHex}\"" <<< "{ \"type\": \"Unwitnessed Tx BabbageEra\", \"description\": \"Ledger Cddl Format\" }" 2> /dev/null)
if [[ $? -ne 0 ]]; then echo -e "\e[35mError during tx-raw conversion!\n\e[0m"; exit 1; fi
echo ${txFile} > "${txRawFile}"
if [[ $? -ne 0 ]]; then echo -e "\e[35mError, can't write tx-raw file ${txRawFile}!\n\e[0m"; exit 1; fi
echo -ne "\e[90m"
cat "${txRawFile}"
echo -e "\e[0m"


#Signing the tx-raw with the additional witnesses
txSignedFile="${tempDir}/tx.signed"
echo -e "\e[0mSigning the tx-raw with the secret keys '${stakeSKEY}', '${paymentSKEY}':\e[32m ${txSignedFile}\e[90m"
echo
echo -e "${cardanocli} transaction sign \ \n\t--tx-file \"${txRawFile}\" \ \n\t--signing-key-file \"${stakeSKEY}\" \ \n\t--signing-key-file \"${paymentSKEY}\" \ \n\t--mainnet \ \n\t--out-file \"${txSignedFile}\"\n"

${cardanocli} transaction sign --tx-file "${txRawFile}" --signing-key-file "${stakeSKEY}" --signing-key-file "${paymentSKEY}" --mainnet --out-file "${txSignedFile}"
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi;
echo -ne "\e[90m"
cat "${txSignedFile}"
echo -e "\e[0m"


#Ask user to submit the signed transaction
if ask "\n\e[33mDoes this look good for you, continue ?" N; then

	#Submit the transaction via koios
	echo
	echo -ne "\e[0mSubmitting the transaction via the node ... "

#	cborHex=$(jq -r .cborHex "${txSignedFile}"); checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi
#	txBinData=$(xxd -ps -r <<< ${cborHex} | tr -d '\0')
#	response=$(curl -s -m 20 -X POST "${koiosAPI}/submittx" -H "Content-Type: application/cbor" --data-binary ${txBinData})
#	echo ${response}
#	exit 1

	${cardanocli} transaction submit --tx-file "${txSignedFile}" --mainnet
	checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi
	echo -e "\e[32mDONE\n"

	#Show the TxID
	txID=$(${cardanocli} transaction txid --tx-file "${txSignedFile}"); echo -e "\e[0m TxID is: \e[32m${txID}\e[0m"
	checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi;
	echo -e "\e[0mTracking: \e[32m${transactionExplorer}/${txID}\n\e[0m"

	#TIP message :-)
	echo -e "If you're super happy, you can express your happiness by sending a tip to: \$gitmachtl :-)"
	echo

fi


#DONE
echo -e "\e[0m"
