## Tool to sign data with a Cardano-Secret-Key // verify data with a Cardano-Public-Key

This tool can **sign** any hexdata with a provided normal or extended secret key. The signing output is a signature in hex format and also the public key of the provided secret key for verification.<br>
The tool can also **verify** a signature for any hexdata together with a provided public key. The verification output is true(exitcode=0) or false(exitcode=1).

### Demo Signing

![image](https://user-images.githubusercontent.com/47434720/189545429-72fc948e-fd05-41ae-bf08-6a830b0ee210.png)

### Demo Verify

![image](https://user-images.githubusercontent.com/47434720/189545483-181b1b2a-546b-4809-afb4-5f1d2428411a.png)


### Usage

``` console

$ cardano-signer help

cardano-signer 1.1.0

Usage Signing:

   cardano-signer sign <data(hex)> <secret_key(hex)>

   Output: signature(hex) + public_key(hex)


Usage Verify:

   cardano-signer verify <data(hex)> <signature_to_verify(hex)> <public_key(hex)>

   Output: true(exitcode 0) or false(exitcode 1)

```

### Contacts

* Telegram - @atada_stakepool<br>
* Twitter - [@ATADA_Stakepool](https://twitter.com/ATADA_Stakepool)<br>
* Discord - MartinLang \[ATADA, SPO Scripts\]#5306
* Email - stakepool@stakepool.at<br>
* Homepage - https://stakepool.at
