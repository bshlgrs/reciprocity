#%%

import os
import requests
def send_simple_message():
  	return requests.post(
  		"https://api.mailgun.net/v3/sandboxb184ff893a9147579670ca96cfb68d39.mailgun.org/messages",
  		auth=("api", 'a1dad75f-8ab8866e'),
  		data={"from": "Mailgun Sandbox <postmaster@sandboxb184ff893a9147579670ca96cfb68d39.mailgun.org>",
			"to": "Buck Shlegeris <bshlegeris@gmail.com>",
  			"subject": "Hello Buck Shlegeris",
  			"text": "Congratulations Buck Shlegeris, you just sent an email with Mailgun! You are truly awesome!"})
# %%
