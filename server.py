from flask import Flask, send_file, request
import os
import json

app = Flask(__name__)

@app.route('/')
def index():
	with open('main.html', 'r') as f:
		return f.read()

@app.route('/images')
def images():
	# Get a list of all the image filenames in the 'images' folder
	path = os.path.join(os.getcwd(),"gifs")
	image_filenames = [f for f in os.listdir(path) if f.endswith(('.gif', '.jpeg', '.png'))]
	data = {'filenames': image_filenames}
	# Return the list as a JSON object
	return json.dumps(data)


@app.route('/gifs/<filename>')
def gif(filename):
	# Check if the file exists in the 'gifs' folder
	if not os.path.exists('gifs/{}'.format(filename)):
		return 'File not found', 404
	# Return the gif file
	return send_file('gifs/{}'.format(filename))

@app.route('/lightingchange', methods=['POST'])
def lightingChange():
	data = request.get_json()
	print(data)
	#red = data['r']
	#green = data['g']
	#blue = data['b']

	print("lighting change requested")
	#print(red, green, blue)

	return '', 200

if __name__ == '__main__':
	app.run()