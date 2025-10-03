# Contributing 

Hi! Thanks for considering contributing to Meelo. The project is open-source and is free, so contributions are essential to keep the project alive. 

Be aware that your code contributions will be published under the [GPL-3.0 license](https://github.com/Arthi-chaud/Meelo/blob/main/LICENSE).

## Kinds of contributions

In this document we consider three kinds of contributions:

- Ideas
    - Bug reports
    - Feature or improvement ideas
- Code
- Documentation
  - For users (e.g. wiki) or developers (e.g. the READMEs in each app directory)

## General guidelines 

When contributing, please consider the following:
- If you want to suggest new feature or improvement, please open an issue first 
    - If you want to implement said feature, clearly state it in the issue's body
        - Wait for the approval of the maintainer before starting.
- If you noticed a bug 
    - Either open an issue to report or ask about it
    - If you are certain it is a bug and not a design choice and wish to fix it, you can open a pull request, no need to create an issue beforehand.
- If you want to contribute to the user documentation
    - please first open an issue listing what you want to add/modify 
    - provide the new content in the issue's body.
- If you want to contribute to the developer's documentation
   - No need for an issue, you can create your pull request right away.

## Code-related guidelines

### Submitting a pull request

1. Fork and clone the repository.
2. Create a new branch: `git checkout -b my-branch-name`.
3. Write code.
4. Make sure the code is formatted correctly.
5. Make sure all previous tests pass.
6. Push to your fork and submit a pull request.

### Developer documentation

Each service/app comes with a README dedicated to developers. Please read it to better understand about how the project works. **Warning**: these may be incomplete and/or outdated. If that's the case, please report it (or open a PR).

### Code formatting

All submitted code should be formatted and linted. When submitting code, please make sure your code is formatted properly (e.g. with Biome) and does not trigger any lint errors.

If you are not sure what tooling is used for a specific app, please open an issue.

### Testing 

Some apps have unit tests. If it is doable, please write tests for your code. This is not mandatory but highly appreciated. If you have questions about how to set up the testing environment, please open an issue. 

**All tests should pass locally**. As long as that's not the case, your contribution will not be accepted.

### CI

If you opened a pull request, the `Dockerisation` steps of the CI might fail. This is expected and should be addressed at some point. All other CI steps should pass (with one exception: the Matcher's tests might fail randomly). 

