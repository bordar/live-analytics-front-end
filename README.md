# Live Analytics Front End

Front-end project for showing real-time reports for Borhan live entries.
The project is based on AngularJS + Bootstrap, and uses a number of 3rd-party libraries for graphs, maps, etc. 

## Installation on Borhan server
Unzip tag distributables to /opt/borhan/apps/liveanalytics

## Running the project not through Borhan BMC
This can be done for dev purposes - it uses un-minimized code, etc.

##### Option 1:
Edit app/index.html with relevant values (partner id, ks, etc), then navigate on your local host to this file

##### Option 2:
Navigate to the project's dashboard route on your localhost with the relevant params, ie <br>
http://localhost/app/#/dashboard/player=your_player_id|pid=your_partner_id|ks=your_ks|svc=service_url_no_protocol|cdn=cdn_host_no_protocol <br>
(note the pipes vs slashes) <br>
The provided values will override values hardcoded in app/index.html



### Copyright & License

All code in this project is released under the [AGPLv3 license](http://www.gnu.org/licenses/agpl-3.0.html) unless a different license for a particular library is specified in the applicable library path.

Copyright © Borhan Inc. All rights reserved.
