# On-demand Compute

Status: **In Development**

On-demand compute is Differential's managed compute offering that runs your Differential services on-demand in a serverless setting.

Since the control-plane has the knowledge of how many function calls are being made and how frequently, it can use this information to spin up the service on-demand and scale it down when it's not being used.

Because a single service session can execute multiple function calls, you don't have to worry about the cold start time of the function. The service will be kept warm for a certain period of time after the last function call.

On-demand compute is currently in development and will be available soon. To gain early access, please sign up for the waitlist [here](https://forms.fillout.com/t/9M1VhL8Wxyus).
