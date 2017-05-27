import React, {
    Component,
    PropTypes,
} from 'react';
import { FormGroup, FormControl, ControlLabel, HelpBlock, Button, InputGroup } from 'react-bootstrap'

//Validated input for react-bootstrap

export class ValidatedForm extends Component {
    constructor(props){
        super(props);
        this._handleChange = this._handleChange.bind(this);
        this.state = {
            validatableFields: {}
        };
    }

    _handleChange(key, payload){
        let { validatableFields } = this.state;
        validatableFields[key] = payload;
        this.setState(validatableFields)
        //This is where the new state will be written if the object passes the regex specified in the child validated input.
    }

    _renderInput(child){
        let { reference } = child.props;
        return React.cloneElement(child, {
            onChange: this._handleChange,
            value: (this.state[reference]) ? this.state[reference].content : "",
            key: reference
        })
    }

    _renderInputGroup(child){
        let { reference } = child.props;
        return React.cloneElement(child, {
            onChange: this._handleChange,
            value: (this.state[reference]) ? this.state[reference].content : "",
            key: reference,
        })
    }

    submit(){
        let { onSubmit } = this.props;
        let payload = this._sanitize(this.state.validatableFields);
        onSubmit( payload );
    }

    //The current implementation of _sanitize should be taken out of the context of the validation library as it is use-case-dependant.
    _sanitize(source){
        let sanitizedSource = {};
        Object.keys(source).map(key => {
            if (key.startsWith("extra-label")){
                let index = key.charAt(key.length-1);
                sanitizedSource[source[key].content] = (source[key].content) ? parseFloat(source[`extra-amount-${index}`].content) : 0;
            } else if (!key.startsWith("extra-amount")) {
                sanitizedSource[key] = (source[key].content) ? parseFloat(source[key].content) : 0;
            }
        });
        return sanitizedSource;
    }

    _renderButton(child){
        return React.cloneElement(child, {validationState: this._isValidated(), onClick: this.submit.bind(this)})
    }

    _isValidated(){
        let { validatableFields } = this.state;
        let validatableKeys = Object.keys(validatableFields);
        if (!validatableKeys.length){
            return this.props.hasRequired
        } else {
            let isVerified = true;
            for (let i = 0; i < validatableKeys.length; i++){
                isVerified = isVerified && validatableFields[validatableKeys[i]].verifiedState;
            }
            return !isVerified;
        }

    }

    _traverseChildTree(children){
        return React.Children.map(children, (child) =>{
            if (React.isValidElement(child)){
                switch (child.type) {
                    case ValidatedInput:
                        return this._renderInput(child);
                    case ValidatedButton:
                        return this._renderButton(child);
                    case ValidatedInputGroup:
                        return this._renderInputGroup(child);
                    default:
                        let nestedChildren = {};
                        nestedChildren.children = this._traverseChildTree(child.props.children);
                        return React.cloneElement(child, nestedChildren);
                }
            } else return child
        })
    }

    render(){
        return(
            <div>
                {this._traverseChildTree(this.props.children)}
            </div>
        )
    }
}

ValidatedForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    hasRequired: PropTypes.bool
};

ValidatedForm.defaultProps = {
    hasRequired: false
};

export class ValidatedInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: "",
        }
    }

    render() {
        let { reference } = this.props;
        return (
            <FormGroup
                style={this.props.style}
                controlId="formBasicText"
                validationState={this._getValidationState()}>
                <ControlLabel srOnly={true}>{this.props.hint}</ControlLabel>
                {' '}
                <FormControl
                    type="text"
                    value={this.props.value}
                    placeholder={this.props.hint}
                    onChange={this._onChange.bind(this, reference)}
                />
                <FormControl.Feedback />
                <HelpBlock>{this._getHelpText()}</HelpBlock>
            </FormGroup>
        );
    }

    _onChange(key, event){
        let { value } = event.target;
        let { onChange } = this.props;
        let validationState = this._preVerifyBoolean(value);
        let field = {
            content: value,
            verifiedState: validationState
        };
        onChange(key, field);
    }

    _preVerifyBoolean(value){
        let { regEx } = this.props;
        if (!regEx){
            return true;
        } else {
            if (!value) {
                return !this.props.isRequired;
            } else return !!regEx.test(value);
        }
    }

    _getHelpText(){
        switch (this._getValidationState()){
            case null:
            case 'success':
                return null;
            case 'error':
                return this.props.helpText;
            default:
                return null;
        }
    }

    _getValidationState(){
        let { regEx } = this.props;
        if (!regEx){
            return null;
        }else {
            if (!this.props.value){
                return null;
            } else if (regEx.test(this.props.value)){
                return 'success'
            } else {
                return 'error'
            }
        }
    }
}

ValidatedInput.propTypes = {
    regEx: PropTypes.object.isRequired,
    helpText: PropTypes.string,
    isRequired: PropTypes.bool
};

ValidatedInput.defaultProps = {
    helpText: "Please enter a number."
};

export class ValidatedButton extends Component {
    constructor(props){
        super(props);
        this.state={
            disabled: this.props.validationState
        }
    }

    render(){
        return(
            <Button disabled={this.props.validationState} onClick={this.props.onClick}> {this.props.label} </Button>
        )
    }
}

ValidatedButton.propTypes = {
    label: PropTypes.string.isRequired
};

ValidatedButton.defaultProps = {
    label: "Submit"
};

export class ValidatedInputGroup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: "",
        }
    }

    render() {
        let { reference } = this.props;
        return (
            <FormGroup
                style={this.props.style}
                controlId="formBasicText"
                validationState={this._getValidationState()}>
                <ControlLabel srOnly={true}>{this.props.hint}</ControlLabel>
                {' '}
                <InputGroup>
                <FormControl
                    type="text"
                    value={this.props.value}
                    placeholder={this.props.hint}
                    onChange={this._onChange.bind(this, reference)}
                />
                    <FormControl.Feedback />
                    {this.props.children}
                </InputGroup>
                <HelpBlock>{this._getHelpText()}</HelpBlock>
            </FormGroup>
        );
    }

    componentDidUpdate(prevProps){
        if (prevProps.isRequired !== this.props.isRequired){
            this._onChange(this.props.reference, {target: {value: ''}})
        }
    }

    _onChange(key, event){
        let { value } = event.target;
        let { onChange } = this.props;
        let validationState = this._preVerifyBoolean(value);
        let field = {
            content: value,
            verifiedState: validationState
        };
        onChange(key, field);
    }

    _preVerifyBoolean(value){
        let { regEx } = this.props;
        if (!regEx){
            return true;
        } else {
            if (!value) {
                return !this.props.isRequired;
            } else return !!regEx.test(value);
        }
    }

    _getHelpText(){
        switch (this._getValidationState()){
            case null:
            case 'success':
                return null;
            case 'error':
                return this.props.helpText;
            default:
                return null;
        }
    }

    _getValidationState(){
        let { regEx } = this.props;
        if (!regEx){
            return null;
        }else {
            if (!this.props.value){
                return null;
            } else if (regEx.test(this.props.value)){
                return 'success'
            } else {
                return 'error'
            }
        }
    }
}

ValidatedInputGroup.propTypes = {
    regEx: PropTypes.object.isRequired,
    helpText: PropTypes.string
};

ValidatedInputGroup.defaultProps = {
    helpText: "Please enter a number."
};