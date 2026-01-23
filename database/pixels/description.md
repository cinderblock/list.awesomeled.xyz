Addressable pixels are LEDs with built-in driver ICs that allow individual control of each LED's color and brightness.
Unlike simple RGB strips, each pixel has its own address in the data chain.

Key specifications to understand:

- **Color order** - RGB, GRB, RGBW, etc. determines which byte controls which color
- **Voltage** - LED operating voltage (often 5V or 12V)
- **Data protocol** - Single-wire (WS2812) vs clocked (APA102/SK9822)
- **PWM frequency** - Higher frequencies reduce visible flicker, especially on camera
- **Package size** - Physical LED dimensions (2020, 5050, etc.)
