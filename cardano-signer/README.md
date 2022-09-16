## Tool to sign data with a Cardano-Secret-Key // verify data with a Cardano-Public-Key

This tool can **sign** any hexdata with a provided normal or extended secret key. The signing output is a signature in hex format and also the public key of the provided secret key for verification.<br>
The tool can also **verify** a signature for any hexdata together with a provided public key. The verification output is true(exitcode=0) or false(exitcode=1).


### Usage

``` console

$ ./cardano-signer --help
cardano-signer 1.3.0

Signing a hexstring(data):

   Syntax: cardano-signer sign
   Params: --data "<data_hex>"   				data to sign in hexformat
           --secret-key "<secretKey_file|secretKey_hex>"	path to a signing-key-file or a direct signing-hex-key string
           [--out-file "<path_to_file>"]			optional path to an output file (default: standard-output)
   Output: signature_hex + publicKey_hex


Verifying a hexstring(data)+signature+publicKey:

   Syntax: cardano-signer verify
   Params: --data "<data_hex>"   				data to verify in hexformat
           --signature "<signature_hex>"			signature in hexformat
           --public-key "<publicKey_file|publicKey_hex>"	path to a public-key-file or a direct public-hex-key string
   Output: true(exitcode 0) or false(exitcode 1)

```

### Demo - Signing

``` console
### SIGN HEXDATA WITH A KEY-HEXSTRING

$ cardano-signer sign --data "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --secret-key "c14ef0cc5e352446d6243976f51e8ffb2ae257f2a547c4fba170964a76501e7a"
ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03 9be513df12b3fabe7c1b8c3f9fab0968eb2168d5689bf981c2f7c35b11718b27

$ cardano-signer sign --out-file mySignature.txt --data "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --secret-key "c14ef0cc5e352446d6243976f51e8ffb2ae257f2a547c4fba170964a76501e7a"
#Signature+publicKey was written to the file mySignature.txt

$ cardano-signer sign --data "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --secret-key "c14ef0cc5e352446d6243976f51e8ffb2ae257f2a547c4fba170964a"
Error: Invalid normal secret key

$ cardano-signer sign --data "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --secret-key "c14ef0cc5e352446d6243976f51e8ffb2ae257f2a547c4fba170964a76501e7a88afe88fa8f888544e6f5a5f555e5faf6f6f"
Error: Invalid extended secret key

### SIGN HEXDATA WITH A KEY-FILE

$ cardano-signer sign --data "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --secret-key owner.staking.skey
ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03 9be513df12b3fabe7c1b8c3f9fab0968eb2168d5689bf981c2f7c35b11718b27

$ cardano-signer sign --data "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --secret-key owner.staking.vkey
Error: The file 'owner.staking.vkey' is not a signing/secret key json
```

### Demo - Verification

``` console
### VERIFY HEXDATA WITH A SIGNATURE AND A KEY-HEXSTRING

$ cardano-signer verify --data "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --signature "ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03" --public-key "9be513df12b3fabe7c1b8c3f9fab0968eb2168d5689bf981c2f7c35b11718b27"
true

$ cardano-signer verify --data "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --signature "ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03" --public-key "aaaaaaaaaab3fabe7c1b8c3f9fab0968eb2168d5689bf981c2f7c35b11718b27"
false

$ cardano-signer verify --data "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --signature "aaaaaaaaaa45dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03" --public-key "9be513df12b3fabe7c1b8c3f9fab0968eb2168d5689bf981c2f7c35b11718b27"
false

### VERIFY HEXDATA WITH A SIGNATURE AND A KEY-FILE

$ cardano-signer verify --data "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --signature "ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03" --public-key owner.staking.vkey
true

$ cardano-signer verify --data "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" --signature "ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03" --public-key owner.staking.skey
Error: The file 'owner.staking.skey' is not a verification/public key json

```

### Release Notes

* 1.3.0: New Syntax - Now supporting true parameter/flag names. This makes it easier to add feature in the future. Also added new optional `--out-file` option, which would write the signature+publicKey to a file and not to the standard output.
* 1.2.0: Added support to use Cardano-Key-Files in addition to a direct Key-Hexstring. Supports standard sKey/vKey JSON files and also files with a Bech32-Key in it, like the ones generated via jcli
* 1.1.0: Added functionality to do also a Verification of the Signature together with the data and the Public Key.
* 1.0.0: Initial version, supports signing of a Data-Hexstring string with a Key-Hexstring.

### Contacts

* Telegram - @atada_stakepool<br>
* Twitter - [@ATADA_Stakepool](https://twitter.com/ATADA_Stakepool)<br>
* Discord - MartinLang \[ATADA, SPO Scripts\]#5306
* Email - stakepool@stakepool.at<br>
* Homepage - https://stakepool.at
