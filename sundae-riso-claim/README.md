# SundaeSwap RISO Rewards Claim Script

This small script can be used to claim the RISO rewards via a CLI stakeaddress, stake-key, paymentadress & payment-key.<br>
The script is using the `koios` API to request the needed UTXO information.

## What binaries are needed

Make sure you have `curl` and `jq` installed on your system. If you're working with a debian/ubuntu based system you can simply install the packages via:

``` console
sudo apt update && sudo apt install curl jq -y
```
> This script will be updated in the future to support the tx-submit also via the `koios`API, but there are some issues currently and i didn't want to hold the script back until they are resolved. So **you currently need a normal running cardano-node & cardano-cli** to submit the tx via this script.

## Install

You just need to download the [script](https://raw.githubusercontent.com/gitmachtl/cardano-related-stuff/master/sundae-riso-claim/claimRISO.sh) to your linux machine and make it executable, like:
``` console
wget -OclaimRISO.sh https://raw.githubusercontent.com/gitmachtl/cardano-related-stuff/master/sundae-riso-claim/claimRISO.sh
chmod +x claimRISO.sh
``` 
In case you also need `cardano-cli`, you can find the binary also in this repo. Download the `cardano-cli.tar.gz` archive and extract it via:
``` console
wget -Ocardano-cli.tar.gz https://github.com/gitmachtl/cardano-related-stuff/raw/master/sundae-riso-claim/cardano-cli.tar.gz
tar -xf cardano-cli.tar.gz
```

## Configuration

The script needs a correctly set path to the `cardano-cli` binary. You can find the setting at the very top of the script. The default behavior is that the script is using `./cardano-cli`. If this is not available, it will try to search for the binary. If this doesn't work, set the correct path in the script.

## Usage

``` console
./claimRISO.sh

Usage: claimRISO.sh <StakeAddress> <PathToStake.skey> <PaymentAddress> <PathToPayment.skey>


Parameters:

         StakeAddress) The stake1... address which was delegated to a RISO pool at the time
     PathToStake.skey) The path to the stake.skey file for the StakeAddress (needed to sign the transaction)
       PaymentAddress) The addr1... address that is receiving the RISO rewards SUNDAE token and that pays for the fees
   PathToPayment.skey) The path to the payment.skey file for the PaymentAddress (needed to sign the transaction)

   Please use a small CLI payment wallet (~5 Ada) for that, don't use your plegde/owner wallet or a big one.


Example:

   claimRISO.sh stake1uypayp2nyzy66tmcz6yjuth59pym0df83rjpk0758fhqrncq8vcdz stake.skey addr1v9ux8dwy800s5pnq327g9uzh8f2fw98ldytxqaxumh3e8kqumfr6d payment.skey

```


## What is it doing under the hood?

1) Checking the given parameters for the stake-address, stake-key, payment-address, payment-key
1) Requesting the available rewards via the SundaeSwap API `https://api.sundae-rewards.sundaeswap.finance/api/v0/rewards`
1) Requesting UTXO information to pay the transaction fees via koios API `https://api.koios.rest/api/v0/address_info`
1) Generating the right query command and request the transaction raw-tx via the SundaeSwap API `https://api.sundae-rewards.sundaeswap.finance/api/v0/rewards/claim`
1) Convert the returned cborHex data into a cardano-cli readable format
1) Sign the raw-tx with the stake-key and the payment-key
1) Submit the signed tx via cardano-node


## Disclaimer

This script is using the API provided via SundaeSwap. Please only use a small payment address, and not your pledge address or one with a huge amount of ADA on it. Use it at your own risk!  

If you're super happy with your claimed SUNDAE tokens, you can express your happiness by sending a little tip to `$gitmachtl`, thx 😄
