#!/bin/bash

#------------------------------------------------------------------------------------------------------------
#-
#- Tool to generate Signing/Verification Keys from Mnemonics. Works with Icarus(Shelley),
#- Ledger and Trezor(Icarus-Trezor) Derivation
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

#Location of cardano-cli - set it to "cardano-cli" if its in your $PATH
cardanocli_bin="./bin/cardano-cli"

#Location of cardano-address binary - set it to "cardano-address" if its in your $PATH
cardanoAddress_bin="./bin/cardano-address"

#Location of cardano-mnemonic-rootkey binary - set it to "cardano-mnemonic-rootkey" if its in your $PATH
cardanoMnemonicRootKey_bin="./bin/cardano-mnemonic-rootkey"

#Location of bech32 binary - set it to "bech32" if its in your $PATH
bech32_bin="./bin/bech32"



#------------------------------------------------------------------------------------------------------------
#-
#- DON'T EDIT BELOW THIS LINE
#-
#------------------------------------------------------------------------------------------------------------


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

#Subroutines to set read/write flags for important files
file_lock()
{
if [ -f "$1" ]; then chmod 400 "$1"; fi
}

file_unlock()
{
if [ -f "$1" ]; then chmod 600 "$1"; fi
}

#Displays an Errormessage if parameter is not 0
checkError()
{
if [[ $1 -ne 0 ]]; then echo -e "\n\n\e[35mERROR (Code $1) !\e[0m\n"; exit $1; fi
}

#TrimString
function trimString
{
    echo "$1" | sed -n '1h;1!H;${;g;s/^[ \t]*//g;s/[ \t]*$//g;p;}'
}

#------------------------------------------------------------------------------------------------------------
#-
#- Main Start
#-
#------------------------------------------------------------------------------------------------------------

#Check command line parameter
if [ $# -lt 2 ]; then
cat >&2 <<EOF

Usage: $(basename $0) <AddressName> <Mnemonic-Words>

Parameters:

   AddressName) A name prefix for the output files. Example 'mywallet' will generate files like 'mywallet.payment.skey'

   Mnemonic-Words) 12 to 24 space separated Mnemonic-Words


Optional Parameters:

   "Passphrase")    Adds a Passphrase to the Mnemonic Words. This is used in Hardware-Wallets for additional Accounts.

   "der: wallet")   Is used by Wallets like Daedalus / Eternl / Adalite / Yoroi and Hardware-Trezor-Wallets (default)
   "der: ledger")   Is used by Hardware-Ledger-Wallets
   "der: trezor")   Is used by Hardware-Trezor-Wallets with a 24 Word-Mnemonic, 12-15-18 Word-Mnemonics use 'wallet'

   "idx: 0-1000")   Sets the IndexNo of the DerivationPath: 1852H/1815H/*H/*/IndexNo (default: 0)

   "acc: 0-1000")   Sets the AccountNo of the DerivationPath: 1852H/1815H/<AccountNo>H/*/* (default: 0)

   "net: testnet")  Switches the AddressFormat into Testnet-Format (default: mainnet)

   "pay: change")   Switches the PaymentPath from 1852H/1815H/*H/0/* to 1852H/1815H/*H/1/*
                    to get the ChangeAddresses instead of the PaymentAddresses (default: payment)
                    The StakingPath is fixed to 1852H/1815H/<AccountNo>H/2/0

Examples:

   $(basename $0) myWallet "word1 word2 ... word24"
   -> Keys from Shelley-Mnemonics, Account 0 (default), Index 0 (default), MainNet

   $(basename $0) myWallet "word1 word2 ... word15" "idx: 1"
   -> Keys from Shelley-Mnemonics, Account 0 (default), Index 1, MainNet

   $(basename $0) myLedger "word1 word2 ... word24" "mySecretPassphrase" "der: ledger" "net: testnet"
   -> Keys from HW-Ledger-Mnemonics + Passphrase "mySecretPassphrase", Account 0 (default), Index 0 (default), TestNet

   $(basename $0) myTrezor "word1 word2 ... word12" "net: testnet"
   -> Keys from HW-Trezor-Mnemonics(12words), Account 0 (default), Index 0 (default), TestNet

   $(basename $0) myTrezor "word1 word2 ... word24" "acc: 3" "net: testnet" "pay: change" "idx: 2" "der: trezor"
   -> Keys from HW-Trezor-Mnemonics(24words), ChangeAddress from Account 3, Index 2, TestNet


EOF
exit 1;
fi


addrName="${1}"

paramCnt=$#;
allParameters=( "$@" )
mnemonics="${allParameters[1]}" #read the mnemonics
mnemonics=$(trimString "${mnemonics,,}") #convert to lowercase and trim it
mnemonicsWordcount=$(wc -w <<< ${mnemonics})

accountNo=0 #set default accountNo
indexNo=0 #set default indexNo
payPath=0 #set default paymentPath, can be changed to 1 to get the change addresses
derType="icarus" #set default encoding type
derStr="wallet (icarus-method)"

addrformat="--mainnet" #default addrformat
networktag="mainnet" #default networktag

#get additional parameters: passphrase and paymentAccountNo
for (( tmpCnt=2; tmpCnt<${paramCnt}; tmpCnt++ ))
do
        paramValue=${allParameters[$tmpCnt]}

        if [[ "${paramValue,,}" =~ ^acc:(.*)$ ]]; then #if the parameter starts with "acc:" its an accountNo
                accountNo=$(trimString "${paramValue:4}");
		if [[ -z "${accountNo##*[!0-9]*}" || ${accountNo} -lt 0 || ${accountNo} -gt 1000 ]]; then #if given parameter is not a number or below 0 or above 1000, print error message
			echo -e "\e[35mERROR - Account# is out of range 0-1000!\e[0m\n"; exit 1; fi

        elif [[ "${paramValue,,}" =~ ^idx:(.*)$ ]]; then #if the parameter starts with "idx:" its an indexNo
                indexNo=$(trimString "${paramValue:4}");
		if [[ -z "${indexNo##*[!0-9]*}" || ${accountNo} -lt 0 || ${accountNo} -gt 1000 ]]; then #if given parameter is not a number or below 0 or above 1000, print error message
			echo -e "\e[35mERROR - Index# is out of range 0-1000!\e[0m\n"; exit 1; fi

        elif [[ "${paramValue,,}" =~ ^net:(.*)$ ]]; then #if the parameter starts with "net:" its the network switch
		network=$(trimString "${paramValue:4}");
		if [[ "${network,,}" == "testnet" ]]; then #if the parameter is the word "testnet", switch to testnet settings
		        addrformat="--testnet-magic 1"   #--testnet and a random magicNo
		        networktag="testnet" #0 for testnet, 1 for mainnet
		elif [[ "${network,,}" == "mainnet" ]]; then #if the parameter is the word "mainnet", switch to mainnet settings
		        addrformat="--mainnet"   #--testnet and a random magicNo
		        networktag="mainnet" #0 for testnet, 1 for mainnet
		else
			echo -e "\e[35mERROR - No network '${network}' supported, only 'mainnet' and 'testnet'. Leave it blank for the default=mainnet!\e[0m\n"; exit 1;
		fi

        elif [[ "${paramValue,,}" =~ ^pay:(.*)$ ]]; then #if the parameter starts with "pay:" its the payment/change switch
		payPathType=$(trimString "${paramValue:4}");
		if [[ "${payPathType,,}" == "change" ]]; then #if the parameter is the word "change", switch to the change-address-path 1852H/1815H/*H/1/*
			payPath=1 #changed to 1 to get the change addresses
		elif [[ "${payPathType,,}" == "payment" ]]; then #if the parameter is the word "payment", switch to the payment-address-path 1852H/1815H/*H/0/*
			payPath=0 #changed to 0 to get the payment addresses
		else
			echo -e "\e[35mERROR - No Payment-Path '${payPathType}' supported, only 'payment' and 'change'. Leave it blank for the default=payment!\e[0m\n"; exit 1;
		fi

        elif [[ "${paramValue,,}" =~ ^der:(.*)$ ]]; then #if the parameter starts with "der:" its the encoding type switch
		derStr=$(trimString "${paramValue:4}");
		if [[ "${derStr,,}" == "wallet" ]]; then #if the parameter is the word "wallet", use the icarus derivation method
			derType="icarus"; derStr="wallet (icarus-method)"
		elif [[ "${derStr,,}" == "ledger" ]]; then #if the parameter is the word "ledger", use the ledger derivation method
			derType="ledger"; derStr="ledger (ledger-method)"
		elif [[ "${derStr,,}" == "trezor" ]]; then #if the parameter is the word "trezor", use the icarus-trezor derivation method but only for 24 word mnemonics
			derType="icarus-trezor"; derStr="trezor (icarus-trezor method)"
		else
			echo -e "\e[35mERROR - No Encoding-Type '${derStr}' supported, only 'wallet', 'ledger' or 'trezor'. Leave it blank for the default=wallet !\e[0m\n"; exit 1;
		fi

	else #if parameter not starts with "acc/net/pay/der:" than its most likely the passphrase
		passphrase="${paramValue}"
        fi
done


#check about the derivation method and the mnemonic word counting
if [[ ${mnemonicsWordcount} -lt 12 || ${mnemonicsWordcount} -gt 24 ]]; then echo -e "\e[35mERROR - Please use 12, 15, 18 or 24 Mnemonic words!\e[0m\n"; exit 1; fi
if [[ "${derType}" == "icarus-trezor" && ${mnemonicsWordcount} -ne 24 ]]; then echo -e "\e[35mERROR - The derivation '${derStr}' is only allowed with 24 Mnemonic words! Use the default 'wallet' for less than 24 words.\e[0m\n"; exit 1; fi

#extend name if account/index/payment/change are not default
if [[ ${accountNo} -gt 0 ]]; then addrName="${addrName}-acc${accountNo}"; fi
if [[ ${indexNo} -gt 0 ]]; then addrName="${addrName}-idx${indexNo}"; fi
if [[ ${payPath} -eq 1 ]]; then addrName="${addrName}-change"; fi

#safety
if [ -f "${addrName}.staking.skey" ]; then echo -e "\e[35mWARNING - ${addrName}.staking.skey already present, delete it or use another name !\e[0m"; exit 2; fi
if [ -f "${addrName}.staking.vkey" ]; then echo -e "\e[35mWARNING - ${addrName}.staking.vkey already present, delete it or use another name !\e[0m"; exit 2; fi
if [ -f "${addrName}.staking.addr" ]; then echo -e "\e[35mWARNING - ${addrName}.staking.addr already present, delete it or use another name !\e[0m"; exit 2; fi
if [ -f "${addrName}.staking.cert" ]; then echo -e "\e[35mWARNING - ${addrName}.staking.cert already present, delete it or use another name !\e[0m"; exit 2; fi
if [ -f "${addrName}.payment.skey" ]; then echo -e "\e[35mWARNING - ${addrName}.payment.skey already present, delete it or use another name !\e[0m"; exit 2; fi
if [ -f "${addrName}.payment.vkey" ]; then echo -e "\e[35mWARNING - ${addrName}.payment.vkey already present, delete it or use another name !\e[0m"; exit 2; fi
if [ -f "${addrName}.payment.addr" ]; then echo -e "\e[35mWARNING - ${addrName}.payment.addr already present, delete it or use another name !\e[0m"; exit 2; fi


#Check the cardano-cli binary existance
if ! exists "${cardanocli_bin}"; then
                                #Try to find it via "which"
				cardanocli_bin=$(which cardano-cli)
                                if ! exists "${cardanocli_bin}"; then majorError "Path ERROR - Path to the 'cardano-cli' binary is not correct or 'cardano-cli' binaryfile is missing!\nYou can find it here: https://github.com/input-output-hk/cardano-node"; exit 1; fi
fi

#Check the cardano-address binary existance
if ! exists "${cardanoAddress_bin}"; then
                                #Try to find it via "which"
				cardanoAddress_bin=$(which cardano-address)
                                if ! exists "${cardanoAddress_bin}"; then majorError "Path ERROR - Path to the 'cardano-address' binary is not correct or 'cardano-address' binaryfile is missing!\nYou can find it here: https://github.com/input-output-hk/cardano-addresses"; exit 1; fi
fi

#Check the cardano-mnemonic-rootkey binary existance
if ! exists "${cardanoMnemonicRootKey_bin}"; then
                                #Try the find it via "which"
				cardanoMnemonicRootKey_bin=$(which cardano-mnemonic-rootkey)
                                if ! exists "${cardanoMnemonicRootKey_bin}"; then majorError "Path ERROR - Path to the 'cardano-mnemonic-rootkey' binary is not correct or 'cardano-mnemonic-rootkey' binaryfile is missing!"; exit 1; fi
fi

#Check the bech32 binary existance
if ! exists "${bech32_bin}"; then
                                #Try to find it via "which"
				bech32_bin=$(which bech32)
                                if ! exists "${bech32_bin}"; then majorError "Path ERROR - Path to the 'bech32' binary is not correct or 'bech32' binaryfile is missing!\nYou can find it here: https://github.com/input-output-hk/bech32"; exit 1; fi
fi

echo
echo -e "\e[0mConverting Mnemonic-Keys to CLI-Keys for the Output-FileName: \e[32m ${addrName}.*\e[0m"
echo

echo -e "\e[0m  Mnemonics:\e[32m ${mnemonics}\e[0m"
echo -e "\e[0m Passphrase:\e[32m ${passphrase}\e[0m"
echo -e "\e[0m Derivation:\e[32m ${derStr}\e[0m"
echo -e "\e[0m   Index-No:\e[32m ${indexNo}\e[0m"
echo -e "\e[0m Account-No:\e[32m ${accountNo}\e[0m"
echo -e "\e[0mPaymentPath:\e[32m 1852H/1815H/${accountNo}H/${payPath}/${indexNo}\e[0m"
echo -e "\e[0mStakingPath:\e[32m 1852H/1815H/${accountNo}H/2/0\e[0m"
echo -e "\e[0m NetworkTag:\e[32m ${networktag}\e[0m"
echo
echo -ne "\e[0m Processing: "

#get the bech root_xsk key via cardano-mnemonic-rootkey binary
root_hex=$(${cardanoMnemonicRootKey_bin} "${derType}" "${mnemonics}" "${passphrase}" 2> /dev/null)
if [[ $? -ne 0 || "${root_hex}" == "" || "${root_hex//[![:xdigit:]]}" != "${root_hex}" ]]; then echo -e "\e[35mERROR - Could not derive Root-Key from Ledger-Mnemonics!\n\n${root_hex}\e[0m\n\n"; exit 2; fi
root_xsk=$(${bech32_bin} "root_xsk" <<< ${root_hex} 2> /dev/null)
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi
unset mnemonics passphrase root_hex #forget it, not needed after this line

payment_xsk=$(${cardanoAddress_bin} key child 1852H/1815H/${accountNo}H/${payPath}/${indexNo} <<< "${root_xsk}")
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi

stake_xsk=$(${cardanoAddress_bin} key child 1852H/1815H/${accountNo}H/2/0 <<< "${root_xsk}")
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi

unset root_xsk #forget it, not needed after this line

payment_xvk=$(${cardanoAddress_bin} key public --with-chain-code <<< "${payment_xsk}")
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi

enterprise_addr=$(${cardanoAddress_bin} address payment --network-tag ${networktag} <<< "${payment_xvk}")
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi

${cardanocli_bin} key convert-cardano-address-key --shelley-payment-key --signing-key-file <(echo "${payment_xsk}") --out-file "${addrName}.payment.skey"
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi

${cardanocli_bin} key verification-key --signing-key-file "${addrName}.payment.skey" --verification-key-file "${addrName}.payment.vkey"
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi

stake_xvk=$(${cardanoAddress_bin} key public --with-chain-code <<< "${stake_xsk}")
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi

${cardanoAddress_bin} address stake --network-tag ${networktag} <<< "${stake_xvk}" > "${addrName}.staking.addr"
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi

${cardanocli_bin} key convert-cardano-address-key --shelley-stake-key --signing-key-file <(echo "${stake_xsk}") --out-file "${addrName}.staking.skey"
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi

stake_ext_vkey=$(${cardanocli_bin} key verification-key  --signing-key-file "${addrName}.staking.skey" --verification-key-file /dev/stdout)
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi

${cardanocli_bin} key non-extended-key --extended-verification-key-file <(echo "${stake_ext_vkey}") --verification-key-file "${addrName}.staking.vkey"
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi

base_addr=$(${cardanoAddress_bin} address delegation "${stake_xvk}" <<< "${enterprise_addr}")
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi

${cardanocli_bin} address build --payment-verification-key-file "${addrName}.payment.vkey" --staking-verification-key-file "${addrName}.staking.vkey" ${addrformat} > "${addrName}.payment.addr"
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi

unset payment_xsk stake_xsk

#if the bass_addr is the same as the written out payment.addr, than the keys should be ok
if [[ "${base_addr}" != "$(cat "${addrName}.payment.addr")" ]]; then
	echo -e "\e[35mERROR - Addresses don't match up, cleaning keys!\e[0m\n\n";
	rm -f "${addrName}.*"
	exit 2
fi

#ok, keys should be fine :-)
chmod 400 ${addrName}.* #lock them

echo -e "\e[32mOK\e[0m"
echo

echo -e "\e[0mPayment(Base)-Verification-Key: \e[32m ${addrName}.payment.vkey \e[90m"
cat ${addrName}.payment.vkey
echo

echo -e "\e[0mPayment(Base)-Signing-Key: \e[32m ${addrName}.payment.skey \e[90m"
cat ${addrName}.payment.skey
echo

echo -e "\e[0mVerification(Rewards)-Staking-Key: \e[32m ${addrName}.staking.vkey \e[90m"
cat ${addrName}.staking.vkey
echo

echo -e "\e[0mSigning(Rewards)-Staking-Key: \e[32m ${addrName}.staking.skey \e[90m"
cat ${addrName}.staking.skey
echo

echo -e "\e[0mPayment(Base)-Address built: \e[32m ${addrName}.payment.addr \e[90m"
cat "${addrName}.payment.addr"
echo
echo

echo -e "\e[0mStaking(Rewards)-Address built: \e[32m ${addrName}.staking.addr \e[90m"
cat "${addrName}.staking.addr"
echo
echo

#create an address registration certificate
${cardanocli_bin} stake-address registration-certificate --staking-verification-key-file "${addrName}.staking.vkey" --out-file "${addrName}.staking.cert"
checkError "$?"; if [ $? -ne 0 ]; then exit $?; fi
file_lock "${addrName}.staking.cert"

echo -e "\e[0mStaking-Address-Registration-Certificate built (just in case): \e[32m ${addrName}.staking.cert \e[90m"
cat "${addrName}.staking.cert"
echo
echo




