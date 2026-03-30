import Foundation

@main
struct PortpourriCLI {
    static func main() {
        do {
            let runner = PortpourriCLICommandRunner()
            let response = try runner.run(arguments: Array(CommandLine.arguments.dropFirst()))

            switch response {
            case let .text(text):
                print(text)
            case let .data(data):
                FileHandle.standardOutput.write(data)
                FileHandle.standardOutput.write(Data("\n".utf8))
            }
        } catch {
            fputs("\(error)\n", stderr)
            exit(1)
        }
    }
}
