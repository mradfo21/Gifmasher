from flask import Flask, send_file, request
import os
import json


import serial
import serial.tools.list_ports


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



def find_dmx_port():
	for port in serial.tools.list_ports.comports():
		try:
			ser = serial.Serial(port.device, baudrate=57600, timeout=1)
			ser.write(b"\x00\x00\x00") # send null data to check connection
			response = ser.read(3)
			if response == b"\x00\x00\x00":
				ser.close()
				return port.device
		except (OSError, serial.SerialException):
			pass
	return None


def set_color(red, green, blue, serial_port):
    """Set the color of DMX lights connected to the specified serial port."""
    
    # Open the serial port
    ser = serial.Serial(serial_port, baudrate=115200, timeout=1)
    
    # Create the DMX command packet
    dmx_start_code = bytes([0x7E])
    dmx_length = bytes([0x00, 0x04])
    dmx_command = bytes([0x03])
    dmx_channel = bytes([0x01, 0x00, 0x02, 0x00, 0x03, 0x00])
    dmx_data_bytes = bytes([red, green, blue])
    
    # Concatenate the packet
    dmx_data_packet = dmx_start_code + dmx_length + dmx_command + dmx_channel + dmx_data_bytes + bytes([0xE7])
    
    # Send the packet
    ser.write(dmx_data_packet)
    
    # Close the serial port
    ser.close()


@app.route('/lightingchange', methods=['POST'])
def lightingChange():
	data = request.get_json()
	print(data)
	red = data['r']
	green = data['g']
	blue = data['b']

	print("lighting change requested")
	print(red, green, blue)
	set_color(red, green, blue, "COM3")
	return '', 200



if __name__ == '__main__':
	app.run()