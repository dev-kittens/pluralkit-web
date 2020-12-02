import React, { Component } from 'react';

class Loading extends Component {
	render() {
		return (
			<div className="App-load">
				<div className="App-ball">
				</div>
				<div style={{animationDelay: '.5s'}} className="App-ball">
				</div>
				<div style={{animationDelay: '1s'}} className="App-ball">
				</div>
				<div style={{animationDelay: '1.5s'}} className="App-ball">
				</div>
			</div>
		)
	}
}

export default Loading;