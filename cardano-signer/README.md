## Tool to sign data with a Cardano-Secret-Key // verify data with a Cardano-Public-Key

This tool can **sign** any hexdata with a provided normal or extended secret key. The signing output is a signature in hex format and also the public key of the provided secret key for verification.<br>
The tool can also **verify** a signature for any hexdata together with a provided public key. The verification output is true(exitcode=0) or false(exitcode=1).


### Usage

``` console

$ cardano-signer help

cardano-signer 1.2.0

Signing a hexstring(data):

        Syntax: cardano-signer sign <data_hex> <secretKey_file|secretKey_hex>
        Output: signature_hex + publicKey_hex


Verifying a hexstring(data)+signature+publicKey:

        Syntax: cardano-signer verify <data_hex> <signature_hex> <publicKey_file|publicKey_hex>
        Output: true(exitcode 0) or false(exitcode 1)

```

### Demo - Signing

![image](https://user-images.githubusercontent.com/47434720/189985745-fd00a34b-882a-4ac7-9031-aad3e84aaaef.png)

``` console
### SIGN HEXDATA WITH A KEY-HEXSTRING

$ cardano-signer sign "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" "c14ef0cc5e352446d6243976f51e8ffb2ae257f2a547c4fba170964a76501e7a"
ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03 9be513df12b3fabe7c1b8c3f9fab0968eb2168d5689bf981c2f7c35b11718b27

$ cardano-signer sign "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" "c14ef0cc5e352446d6243976f51e8ffb2ae257f2a547c4fba170964a"
Error: Invalid normal secret key

$ cardano-signer sign "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" "c14ef0cc5e352446d6243976f51e8ffb2ae257f2a547c4fba170964a76501e7a88afe88fa8f888544e6f5a5f555e5faf6f6f"
Error: Invalid extended secret key

### SIGN HEXDATA WITH A KEY-FILE

$ cardano-signer sign "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" owner.staking.skey
ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03 9be513df12b3fabe7c1b8c3f9fab0968eb2168d5689bf981c2f7c35b11718b27

$ cardano-signer sign "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" owner.staking.vkey
Error: The file 'owner.staking.vkey' is not a signing/secret key json
```

### Demo - Verification

![image](https://user-images.githubusercontent.com/47434720/189986616-962b4ae9-2105-4f5f-aa25-75992dca6341.png)

``` console
### VERIFY HEXDATA WITH A SIGNATURE AND A KEY-HEXSTRING

$ cardano-signer verify "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" "ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03" "9be513df12b3fabe7c1b8c3f9fab0968eb2168d5689bf981c2f7c35b11718b27"
true

$ cardano-signer verify "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" "ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03" "aaaaaaaaaab3fabe7c1b8c3f9fab0968eb2168d5689bf981c2f7c35b11718b27"
false

$ cardano-signer verify "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" "aaaaaaaaaa45dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03" "9be513df12b3fabe7c1b8c3f9fab0968eb2168d5689bf981c2f7c35b11718b27"
false

### VERIFY HEXDATA WITH A SIGNATURE AND A KEY-FILE

$ cardano-signer verify "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" "ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03" owner.staking.vkey
true

$ cardano-signer verify "8f21b675423a65244483506122492f5720d7bd35d70616348089678ed4eb07a9" "ca3ddc10f845dbe0c22875aaf91f66323d3f28e265696dcd3c56b91a8e675c9e30fd86ba69b9d1cf271a12f7710c9f3385c78cbf016e17e1df339bea8bd2db03" owner.staking.skey
Error: The file 'owner.staking.skey' is not a verification/public key json

```

### Release Notes

* 1.2.0: Added support to use Cardano-Key-Files in addition to a direct Key-Hexstring. Supports standard sKey/vKey JSON files and also files with a Bech32-Key in it, like the ones generated via jcli
* 1.1.0: Added functionality to do also a Verification of the Signature together with the data and the Public Key.
* 1.0.0: Initial version, supports signing of a Data-Hexstring string with a Key-Hexstring.

### Contacts

* Telegram - @atada_stakepool<br>
* Twitter - [@ATADA_Stakepool](https://twitter.com/ATADA_Stakepool)<br>
* Discord - MartinLang \[ATADA, SPO Scripts\]#5306
* Email - stakepool@stakepool.at<br>
* Homepage - https://stakepool.at
