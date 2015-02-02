# OpenShift java web application using Jetty library only

A simple java cartridge using maven to start a singel process that can be used for mciro service architeture.

To install this cartridge on OpenShift: 

	rhc app create test https://cartreflect-claytondev.rhcloud.com/reflect?github=luan-cestari/openshift-javajetty-cartridge
	
This command will then clone the code to your local machine.  You can then update the code, git add, git commit, and git push.  
The code will be compiled on the server and run!

Any question, concerns, or issues? Use the issue tracker on this github repository.  
Want to add something cool to this cartridge?  Fork it and submit a Pull Request.

The project LICENSE file is in the root diretory and we are using GPL3.
