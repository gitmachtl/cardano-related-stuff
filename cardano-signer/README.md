## Tool to sign data with a Cardano-Secret-Key // verify data with a Cardano-Public-Key

<img src="https://user-images.githubusercontent.com/47434720/190806957-114b1342-7392-4256-9c5b-c65fc0068659.png" align=right width=40%></img>
This tool can **sign** any hexdata with a provided normal or extended secret key. There is also support to sign a **CIP-8** conform payload. The signing output is a signature in hex format and also the public key of the provided secret key for verification.<br>
The tool can also **verify** a signature for any hexdata together with a provided public key. The verification output is true(exitcode=0) or false(exitcode=1).

   
### Usage

``` console

$ ./cardano-signer --help

cardano-signer 1.4.0

Signing a hex-string or text-string:

   Syntax: cardano-signer sign
   Params: --data-hex "<hex_data>" | --data "<text>"            data/payload to sign in hexformat or textformat
           --secret-key "<secretKey_file|secretKey_hex>"        path to a signing-key-file or a direct signing-hex-key string
           [--cip8]                                             will enable CIP-8 compatible payload signing (also needs --address)
           [--address]                                          signing address in CIP-8 mode (bech format like 'stake1_...')
           [--out-file "<path_to_file>"]                        path to an output file (default: standard-output)
   Output: signature_hex + publicKey_hex


Verifying a hex/text-string(data)+signature+publicKey:

   Syntax: cardano-signer verify
   Params: --data-hex "<data_hex>" | --data "<text>"            data/payload to verify in hexformat or textformat
           --signature "<signature_hex>"                        signature in hexformat
           --public-key "<publicKey_file|publicKey_hex>"        path to a public-key-file or a direct public-hex-key string
   Output: true(exitcode 0) or false(exitcode 1)

```

### Examples - Signing

``` console
### SIGN HEXDATA OR TEXTDATA WITH A KEY-HEXSTRING

$ cardano-signer sign --data-hex "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --secret-key "c14ef0cc5e352446d6243976f51e8ffb2ae257f2a547c4fba170964a76501e7a"
ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03 9be513df12b3fabe7c1b8c3f9fab0968eb2168d5689bf981c2f7c35b11718b27

$ cardano-signer sign --out-file mySignature.txt --data-hex "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --secret-key "c14ef0cc5e352446d6243976f51e8ffb2ae257f2a547c4fba170964a76501e7a"
#Signature+publicKey was written to the file mySignature.txt

$ cardano-signer sign --data-hex "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --secret-key "c14ef0cc5e352446d6243976f51e8ffb2ae257f2a547c4fba170964a"
Error: Invalid normal secret key

$ cardano-signer sign --data-hex "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --secret-key "c14ef0cc5e352446d6243976f51e8ffb2ae257f2a547c4fba170964a76501e7a88afe88fa8f888544e6f5a5f555e5faf6f6f"
Error: Invalid extended secret key

### SIGN HEXDATA OR TEXTDATA WITH A KEY-FILE

$ cardano-signer sign --data-hex "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --secret-key owner.staking.skey
ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03 9be513df12b3fabe7c1b8c3f9fab0968eb2168d5689bf981c2f7c35b11718b27

$ cardano-signer sign --data-hex "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --secret-key owner.staking.vkey
Error: The file 'owner.staking.vkey' is not a signing/secret key json
```

### Examples - Signing (CIP-8)

``` console
### SIGN TEXTDATA IN CIP-8 MODE

$ cardano-signer sign --cip8 --address "stake_test1uqt3nqapz799tvp2lt8adttt29k6xa2xnltahn655tu4sgc6asaqg" --data '{"choice":"Yes","comment":"","network":"preview","proposal":"2038c417d112e005ef61c95d710ee62184a6c177d18b2da891f97cefae4f8535","protocol":"SundaeSwap","title":"Test Proposal - Tampered","version":"1","votedAt":"3137227","voter":"stake_test1uqt3nqapz799tvp2lt8adttt29k6xa2xnltahn655tu4sgc6asaqg"}' --secret-key myStakeKey.skey
5b2e7ac3fbe3cec1540f98fcc29c1ab63778e14a653a2328b2e56af6fd2a714540708e5f3e19670b9b867151c7dfb75061c6b94508d88f43ad3b3893ca213506 57758911253f6b31df2a87c10eb08a2c9b8450768cb8dd0d378d93f7c2e220f0

### SIGN HEXDATA IN CIP-8 MODE

$ cardano-signer sign --cip8 --address "stake_test1uqt3nqapz799tvp2lt8adttt29k6xa2xnltahn655tu4sgc6asaqg" --data-hex "7b2263686f696365223a22596573222c22636f6d6d656e74223a22222c226e6574776f726b223a2270726576696577222c2270726f706f73616c223a2232303338633431376431313265303035656636316339356437313065653632313834613663313737643138623264613839316639376365666165346638353335222c2270726f746f636f6c223a2253756e64616553776170222c227469746c65223a22546573742050726f706f73616c202d2054616d7065726564222c2276657273696f6e223a2231222c22766f7465644174223a2233313337323237222c22766f746572223a227374616b655f7465737431757174336e7161707a373939747670326c7438616474747432396b36786132786e6c7461686e363535747534736763366173617167227d" --secret-key myStakeKey.skey
5b2e7ac3fbe3cec1540f98fcc29c1ab63778e14a653a2328b2e56af6fd2a714540708e5f3e19670b9b867151c7dfb75061c6b94508d88f43ad3b3893ca213506 57758911253f6b31df2a87c10eb08a2c9b8450768cb8dd0d378d93f7c2e220f0
```

### Examples - Verification

``` console
### VERIFY HEXDATA or TEXTDATA WITH A SIGNATURE AND A KEY-HEXSTRING

$ cardano-signer verify --data-hex "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --signature "ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03" --public-key "9be513df12b3fabe7c1b8c3f9fab0968eb2168d5689bf981c2f7c35b11718b27"
true

$ cardano-signer verify --data-hex "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --signature "ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03" --public-key "aaaaaaaaaab3fabe7c1b8c3f9fab0968eb2168d5689bf981c2f7c35b11718b27"
false

$ cardano-signer verify --data-hex "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --signature "aaaaaaaaaa45dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03" --public-key "9be513df12b3fabe7c1b8c3f9fab0968eb2168d5689bf981c2f7c35b11718b27"
false

### VERIFY HEXDATA WITH A SIGNATURE AND A KEY-FILE

$ cardano-signer verify --data-hex "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --signature "ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03" --public-key owner.staking.vkey
true

$ cardano-signer verify --data-hex "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --signature "ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03" --public-key owner.staking.skey
Error: The file 'owner.staking.skey' is not a verification/public key json

```

### Release Notes

* 1.4.0: New parameter `--cip8` enables CIP-8 conform payload signing. New Syntax - Now you can use the parameter `--data` for pure text payloads, and `--data-hex` for hex-encoded payloads. Also a new parameter `--address` was added, which is needed to specify the signing bech address in CIP-8 mode.
* 1.3.0: Now supporting true parameter/flag names. Added new optional `--out-file` option, which would write the signature+publicKey to a file and not to the standard output.
* 1.2.0: Added support to use Cardano-Key-Files in addition to a direct Key-Hexstring. Supports standard sKey/vKey JSON files and also files with a Bech32-Key in it, like the ones generated via jcli
* 1.1.0: Added functionality to do also a Verification of the Signature together with the data and the Public Key.
* 1.0.0: Initial version, supports signing of a Data-Hexstring string with a Key-Hexstring.

### Contacts

* Telegram - @atada_stakepool<br>
* Twitter - [@ATADA_Stakepool](https://twitter.com/ATADA_Stakepool)<br>
* Discord - MartinLang \[ATADA, SPO Scripts\]#5306
* Email - stakepool@stakepool.at<br>
* Homepage - https://stakepool.at
