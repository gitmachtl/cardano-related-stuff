## Blockproducer-Node LeaderShip Interval Check

Super small tool to parse the Logfile of the BlockProducer to see if there are any missing LeaderShip Checks. A LeaderShip Check should appear every slot.

The Logfile must be in JSON-Format, so make sure to write it out in JSON-Format via some settings in your config.json like:

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

Start the tool with the path to your logfile like:

``` console
./checkLeadershipInterval.sh /home/cardano/logs/bp_node.json
```

