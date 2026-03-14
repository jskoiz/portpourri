module.exports = {
  prompt: ({ inquirer }) =>
    inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Feature name:',
      },
    ]),
};
