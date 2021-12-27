## Blockproducer-Node LeaderShip Interval Check

Super small script to parse the Logfile of the BlockProducer to see if there are any missing LeaderShip Checks. A LeaderShip Check should appear every slot.

**Start the tool** with the path to your logfile like:

``` console
./checkLeadershipInterval.sh /home/cardano/logs/bp_node.json
```

The Tool is checking the Interval, the SnapShot-Trigger, if a Block was forged and adopted. You should now see an output like:

![image](https://user-images.githubusercontent.com/47434720/147477380-06a0e511-9852-4cd3-8e58-026e4d7f08a9.png)

The Logfile must be in **JSON-Format**, so make sure to write it out in JSON-Format via some settings in your config.json like:

```json
...
"defaultScribes": [
    [
      "StdoutSK",
      "stdout"
    ],
    [
            "FileSK",
            "/home/cardano/logs/bp_node.json"
    ]
  ],
...
  "setupScribes": [
    {
      "scFormat": "ScJson",
      "scKind": "FileSK",
      "scName": "/home/cardano/logs/bp_node.json",
      "scRotation": null
    }
```
