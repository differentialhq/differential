# Service Discovery

Status: **General Availability**

Differential comes with a built-in service registry, so you can call your services by name, without having to worry about IP addresses, ports, or where it's deployed. Your services phone-home to Differential control-plane.

Your services (whether running in your own compute or Differential cloud) always poll the control-plane to:

1. Advertise their presence
2. Advertise their health
3. Ask for work

This allows you to deploy your services anywhere, even across multiple cloud providers and regions, and still have them communicate with each other without any networking configuration.

It also cuts down the need to secure your services with service to service authentication, as the machines are not directly communicating with each other, or accepting incoming connections. This improves the security posture of your services.
