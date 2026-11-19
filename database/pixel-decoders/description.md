Pixel decoders sit on a pixel data line. They take the data a controller sends to a string
and turn it into something else, or pass it on in better shape:

- **Other outputs** - PWM dimmer channels for plain LED strip, relays, servos, DMX512
- **Signal conditioning** - isolating, boosting or switching the data line
- **Testing** - generating test patterns and analyzing incoming pixel data

They let one pixel controller drive loads it has no outputs for, without another network node.
