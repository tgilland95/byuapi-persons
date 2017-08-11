#!/usr/bin/env bash
docker run -it --name PRO_SYNC -v /Users/danielhancock/Documents/PRO_Sync_Service:/usr/src --env-file /Users/danielhancock/BYU/config-dev2 -p 3000:3000 oracle bash