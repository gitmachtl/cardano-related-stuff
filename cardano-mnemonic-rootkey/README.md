## Tool to generate CLI Payment-/Staking Signing-/Verification-Keys from Mnemonics

This tool works with Mnemonics for normals Shelley(icarus) Wallets, Ledger-Hardware-Wallets and Trezor-Hardware-Wallets

### Supported derivation methods with/without an additional Passphrase

* icarus (shelley): current wallets like Daedalus, Yoroi, Eternl, Adalite and Trezor-HW-Wallets
* trezor (icarus-trezor): like icarus but for the 24-word-seed entropy bug introduced back in the days within the Trezor-FW
* ledger (ledger-method): for Ledger-HW-Wallets

![image](https://user-images.githubusercontent.com/47434720/184905413-a9908236-8f9d-4693-8172-29710b1e8e3e.png)


### Usage

#### 0x_getKeysFromMnemonic.sh - Complete Script to derive all kinds of Keys/AccountNo/Index/Payment-Change ...

``` console

Usage: 0x_getKeysFromMnemonic.sh <AddressName> <Mnemonic-Words>

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

   0x_getKeysFromMnemonic.sh myWallet "word1 word2 ... word24"
   -> Keys from Shelley-Mnemonics, Account 0 (default), Index 0 (default), MainNet

   0x_getKeysFromMnemonic.sh myWallet "word1 word2 ... word15" "idx: 1"
   -> Keys from Shelley-Mnemonics, Account 0 (default), Index 1, MainNet

   0x_getKeysFromMnemonic.sh myLedger "word1 word2 ... word24" "mySecretPassphrase" "der: ledger" "net: testnet"
   -> Keys from HW-Ledger-Mnemonics + Passphrase "mySecretPassphrase", Account 0 (default), Index 0 (default), TestNet

   0x_getKeysFromMnemonic.sh myTrezor "word1 word2 ... word12" "net: testnet"
   -> Keys from HW-Trezor-Mnemonics(12words), Account 0 (default), Index 0 (default), TestNet

   0x_getKeysFromMnemonic.sh myTrezor "word1 word2 ... word24" "acc: 3" "net: testnet" "pay: change" "idx: 2" "der: trezor"
   -> Keys from HW-Trezor-Mnemonics(24words), ChangeAddress from Account 3, Index 2, TestNet

```

#### cardano-mnemonics-rootkey - Tool used by the script above, provides a HEX-RootKey from Mnemonics

``` console

cardano-mnemonic-rootkey 1.0.0

Usage:

        cardano-mnemonic-rootkey <Derivation-Method> <"Mnemonics-Words space separated"> <Optional: "Passphrase-String">

Derivation-Methods:

        'ledger'        for Ledger-HW-Devices
        'icarus'        for Wallets, Trezor-HW-Devices
        'icarus-trezor' for Trezor-HW-Devices using 24 Word-Mnemonic "Bug"

Examples:

        cardano-mnemonic-rootkey ledger "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
        cardano-mnemonic-rootkey icarus "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about" "mySecretPassphrase"

Info:

        Brought to you by: https://github.com/gitmachtl // Cardano SPO Scripts // ATADA Stakepools Austria

```

### Contacts

* Telegram - @atada_stakepool<br>
* Twitter - [@ATADA_Stakepool](https://twitter.com/ATADA_Stakepool)<br>
* Discord - MartinLang \[ATADA, SPO Scripts\]#5306
* Email - stakepool@stakepool.at<br>
* Homepage - https://stakepool.at
